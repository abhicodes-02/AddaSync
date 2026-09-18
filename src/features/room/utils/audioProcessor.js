// src/utils/audioProcessor.js

const NOISE_GATE_WORKLET_CODE = `
class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.sampleRateValue = sampleRate;

    // Gentle adaptive gate. The goal is to reduce constant room/fan noise
    // without chopping the beginning/end of words.
    this.minThreshold = 0.0035;
    this.maxThreshold = 0.018;
    this.noiseAdaptation = 0.0025;

    this.closedGain = 0.08;

    this.attackMs = 8;
    this.holdMs = 120;
    this.releaseMs = 180;

    this.attackCoeff = 1 / Math.max(1, this.sampleRateValue * (this.attackMs / 1000));
    this.releaseCoeff = 1 / Math.max(1, this.sampleRateValue * (this.releaseMs / 1000));

    this.holdSamples = Math.floor(this.sampleRateValue * (this.holdMs / 1000));
    this.holdCounter = 0;

    this.noiseFloor = this.minThreshold;
    this.envelope = 0;
    this.gain = 1;

    this.rmsAccumulator = 0;
    this.rmsCount = 0;
    this.blockRms = 0;

    this.port.onmessage = (event) => {
      if (event.data?.type === "reset") {
        this.noiseFloor = this.minThreshold;
        this.envelope = 0;
        this.gain = 1;
        this.holdCounter = 0;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input.length || !output || !output.length) {
      return true;
    }

    const inputChannel = input[0];
    if (!inputChannel) return true;

    const outputLength = output[0].length;

    // Estimate RMS over the current worklet block.
    let sumSquares = 0;
    for (let i = 0; i < inputChannel.length; i++) {
      const x = inputChannel[i];
      sumSquares += x * x;
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, inputChannel.length));
    this.blockRms = rms;

    // Slowly follow the quiet background only when the signal is quiet.
    // This prevents the threshold from chasing speech.
    if (rms < this.noiseFloor * 1.8) {
      this.noiseFloor = this.noiseFloor * 0.995 + rms * 0.005;
    } else {
      this.noiseFloor = this.noiseFloor * 0.999 + Math.min(rms, this.noiseFloor * 1.2) * 0.001;
    }

    const adaptiveThreshold = Math.min(
      this.maxThreshold,
      Math.max(this.minThreshold, this.noiseFloor + this.noiseAdaptation)
    );

    const openThreshold = adaptiveThreshold;
    const closeThreshold = adaptiveThreshold * 0.72;

    let isOpen = this.holdCounter > 0;

    if (rms >= openThreshold) {
      this.holdCounter = this.holdSamples;
      isOpen = true;
    } else if (rms > closeThreshold && this.holdCounter > 0) {
      isOpen = true;
    } else if (this.holdCounter > 0) {
      this.holdCounter--;
      isOpen = true;
    } else {
      isOpen = false;
    }

    const targetGain = isOpen ? 1 : this.closedGain;

    for (let i = 0; i < outputLength; i++) {
      const x = inputChannel[i] || 0;

      // Envelope smoothing avoids hard sample-by-sample switching.
      const abs = Math.abs(x);
      if (abs > this.envelope) {
        this.envelope += (abs - this.envelope) * this.attackCoeff;
      } else {
        this.envelope += (abs - this.envelope) * this.releaseCoeff;
      }

      const coeff = targetGain > this.gain ? this.attackCoeff : this.releaseCoeff;
      this.gain += (targetGain - this.gain) * coeff;

      output[0][i] = x * this.gain;

      // Preserve stereo compatibility if the context ever supplies it.
      for (let ch = 1; ch < output.length; ch++) {
        output[ch][i] = x * this.gain;
      }
    }

    return true;
  }
}

registerProcessor("noise-gate-processor", NoiseGateProcessor);
`;

export async function createNoiseSuppressedStream(rawStream) {
  if (!rawStream) {
    throw new Error("No raw MediaStream was provided.");
  }

  const audioTracks = rawStream.getAudioTracks();
  const videoTracks = rawStream.getVideoTracks();

  if (!audioTracks.length) {
    return {
      processedStream: rawStream,
      cleanup: () => {}
    };
  }

  let audioContext = null;
  let source = null;
  let highPass = null;
  let lowPass = null;
  let gate = null;
  let compressor = null;
  let limiter = null;
  let outputGain = null;
  let destination = null;
  let workletUrl = null;
  let cleaned = false;

  try {
    audioContext = new AudioContext({ latencyHint: "interactive" });

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    source = audioContext.createMediaStreamSource(rawStream);

    // Remove very low-frequency rumble while keeping natural voice.
    highPass = audioContext.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 75;
    highPass.Q.value = 0.7;

    // Keep speech intelligible without unnecessarily boosting high-frequency fan hiss.
    lowPass = audioContext.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 10500;
    lowPass.Q.value = 0.7;

    workletUrl = URL.createObjectURL(
      new Blob([NOISE_GATE_WORKLET_CODE], { type: "application/javascript" })
    );

    await audioContext.audioWorklet.addModule(workletUrl);

    gate = new AudioWorkletNode(audioContext, "noise-gate-processor", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "speakers"
    });

    // Much gentler than the previous -35 dB / 6:1 compressor.
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.18;

    // Final safety limiter only; it should almost never engage.
    limiter = audioContext.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;

    outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;

    destination = audioContext.createMediaStreamDestination();

    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(gate);
    gate.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(outputGain);
    outputGain.connect(destination);

    const processedAudioTrack = destination.stream.getAudioTracks()[0];

    // Keep the original camera tracks and replace only the microphone track.
    const processedStream = new MediaStream([
      ...videoTracks,
      processedAudioTrack
    ]);

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;

      try { source?.disconnect(); } catch {}
      try { highPass?.disconnect(); } catch {}
      try { lowPass?.disconnect(); } catch {}
      try { gate?.disconnect(); } catch {}
      try { compressor?.disconnect(); } catch {}
      try { limiter?.disconnect(); } catch {}
      try { outputGain?.disconnect(); } catch {}

      try { processedAudioTrack?.stop(); } catch {}

      if (workletUrl) {
        try { URL.revokeObjectURL(workletUrl); } catch {}
      }

      try { audioContext?.close(); } catch {}
    };

    return { processedStream, cleanup };
  } catch (error) {
    console.error("Audio processing failed. Using native WebRTC audio:", error);

    try { source?.disconnect(); } catch {}
    try { highPass?.disconnect(); } catch {}
    try { lowPass?.disconnect(); } catch {}
    try { gate?.disconnect(); } catch {}
    try { compressor?.disconnect(); } catch {}
    try { limiter?.disconnect(); } catch {}
    try { outputGain?.disconnect(); } catch {}

    if (workletUrl) {
      try { URL.revokeObjectURL(workletUrl); } catch {}
    }

    try { await audioContext?.close(); } catch {}

    // Never block the call just because the custom processor failed.
    return {
      processedStream: rawStream,
      cleanup: () => {}
    };
  }
}
