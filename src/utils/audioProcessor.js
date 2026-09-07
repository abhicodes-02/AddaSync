/**
 * Advanced audio processing pipeline for background noise suppression.
 * Uses Web Audio API: Noise Gate (AudioWorklet) + Band-pass Filter + Compressor.
 */

const NOISE_GATE_WORKLET_CODE = `
class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.threshold = 0.008;
    this.gain = 0;
    this.holdCounter = 0;
    this.holdSamples = Math.floor(sampleRate * 0.15);  // 150ms hold
    this.attackCoeff = 1.0 / (sampleRate * 0.003);      // 3ms attack
    this.releaseCoeff = 1.0 / (sampleRate * 0.08);      // 80ms release
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length || !input[0].length) return true;

    for (let ch = 0; ch < input.length; ch++) {
      const inp = input[ch];
      const out = output[ch];

      for (let i = 0; i < inp.length; i++) {
        const level = Math.abs(inp[i]);

        if (level > this.threshold) {
          this.gain = Math.min(1, this.gain + this.attackCoeff);
          this.holdCounter = this.holdSamples;
        } else if (this.holdCounter > 0) {
          this.holdCounter--;
        } else {
          this.gain = Math.max(0, this.gain - this.releaseCoeff);
        }

        out[i] = inp[i] * this.gain;
      }
    }
    return true;
  }
}

registerProcessor('noise-gate-processor', NoiseGateProcessor);
`;

/**
 * Takes a raw MediaStream and returns a processed one with noise suppression.
 * The processed stream has the same video tracks but cleaned-up audio.
 */
export async function createNoiseSuppressedStream(rawStream) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(rawStream);

    // ---- 1. High-pass filter: cut rumble below 80Hz (fans, AC, traffic) ----
    const highPass = audioContext.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 80;
    highPass.Q.value = 0.7;

    // ---- 2. Low-pass filter: cut hiss above 8kHz (not needed for voice) ----
    const lowPass = audioContext.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 8000;
    lowPass.Q.value = 0.7;

    // ---- 3. Notch filter: kill 50Hz electrical hum ----
    const notch50 = audioContext.createBiquadFilter();
    notch50.type = "notch";
    notch50.frequency.value = 50;
    notch50.Q.value = 10;

    // ---- 4. Notch filter: kill 60Hz electrical hum ----
    const notch60 = audioContext.createBiquadFilter();
    notch60.type = "notch";
    notch60.frequency.value = 60;
    notch60.Q.value = 10;

    // ---- 5. Noise Gate via AudioWorklet ----
    const blob = new Blob([NOISE_GATE_WORKLET_CODE], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    await audioContext.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);

    const noiseGate = new AudioWorkletNode(audioContext, "noise-gate-processor");

    // ---- 6. Compressor: normalize volume ----
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -35;
    compressor.knee.value = 20;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // ---- 7. Gain boost to compensate for filtering losses ----
    const makeupGain = audioContext.createGain();
    makeupGain.gain.value = 1.4;

    const destination = audioContext.createMediaStreamDestination();

    // Chain: source → highPass → lowPass → notch50 → notch60 → noiseGate → compressor → gain → destination
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(notch50);
    notch50.connect(notch60);
    notch60.connect(noiseGate);
    noiseGate.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(destination);

    // Build final stream: processed audio + original video tracks
    const processedStream = new MediaStream();
    destination.stream.getAudioTracks().forEach((t) => processedStream.addTrack(t));
    rawStream.getVideoTracks().forEach((t) => processedStream.addTrack(t));

    return {
      processedStream,
      audioContext,
      cleanup: () => {
        try {
          source.disconnect();
          audioContext.close();
        } catch (_) {}
      },
    };
  } catch (err) {
    console.warn("Audio processing failed, falling back to raw stream:", err);
    return {
      processedStream: rawStream,
      audioContext: null,
      cleanup: () => {},
    };
  }
}
