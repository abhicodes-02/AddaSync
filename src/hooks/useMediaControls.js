import { useState, useCallback, useRef } from "react";
import { createPiPStream } from "../utils/streamCompositor";

export default function useMediaControls(localStreamRef, peersRef, setLocalStream) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const shareContext = useRef({
     audioCtx: null,
     originalVideoTrack: null,
     originalAudioTrack: null,
     sharedVideoTrack: null,
  });

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
    window.dispatchEvent(new CustomEvent('mic-status', { detail: !audioTrack.enabled }));
  }, [localStreamRef]);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
    window.dispatchEvent(new CustomEvent('camera-status', { detail: !videoTrack.enabled }));
  }, [localStreamRef]);

  const stopSharing = useCallback(() => {
    const { audioCtx, originalVideoTrack, originalAudioTrack, sharedVideoTrack } = shareContext.current;
    
    if (sharedVideoTrack) {
       sharedVideoTrack.stop();
    }
    
    // Restore original tracks for remote peers
    peersRef.current.forEach(pc => {
      const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (videoSender && originalVideoTrack) videoSender.replaceTrack(originalVideoTrack);
      
      const audioSender = pc.getSenders().find((s) => s.track && s.track.kind === "audio");
      if (audioSender && originalAudioTrack) audioSender.replaceTrack(originalAudioTrack);
    });

    // Restore local video element if we replaced the track locally
    if (localStreamRef.current && sharedVideoTrack && originalVideoTrack) {
       // Only remove if it's currently there
       if (localStreamRef.current.getVideoTracks().includes(sharedVideoTrack)) {
           localStreamRef.current.removeTrack(sharedVideoTrack);
           localStreamRef.current.addTrack(originalVideoTrack);
           if (setLocalStream) {
              setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
           }
       }
    }
    
    if (audioCtx) {
       audioCtx.close().catch(console.error);
    }
    
    if (shareContext.current.pipCleanup) {
       shareContext.current.pipCleanup();
    }
    
    shareContext.current = { audioCtx: null, originalVideoTrack: null, originalAudioTrack: null, sharedVideoTrack: null, pipCleanup: null };
    setIsScreenSharing(false);
    window.dispatchEvent(new CustomEvent('screenshare-status', { detail: false }));
  }, [peersRef, localStreamRef, setLocalStream]);

  const startExternalStream = useCallback((externalStream, replaceLocalVideo = false) => {
    try {
      const externalVideoTrack = externalStream.getVideoTracks()[0];
      const externalAudioTrack = externalStream.getAudioTracks()[0];
      
      const currentCameraTrack = localStreamRef.current?.getVideoTracks()[0];
      const currentMicTrack = localStreamRef.current?.getAudioTracks()[0];

      let mixedAudioTrack = currentMicTrack;
      let audioCtx = null;

      // Mix external audio and microphone if both exist
      if (externalAudioTrack && currentMicTrack) {
        audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();
        
        const micSource = audioCtx.createMediaStreamSource(new MediaStream([currentMicTrack]));
        const sysSource = audioCtx.createMediaStreamSource(new MediaStream([externalAudioTrack]));
        
        micSource.connect(dest);
        sysSource.connect(dest);
        
        mixedAudioTrack = dest.stream.getAudioTracks()[0];
      } else if (externalAudioTrack) {
        mixedAudioTrack = externalAudioTrack;
      }

      // Save context for cleanup
      shareContext.current = {
         ...shareContext.current,
         audioCtx,
         originalVideoTrack: currentCameraTrack,
         originalAudioTrack: currentMicTrack,
         sharedVideoTrack: externalVideoTrack
      };

      // Replace tracks for remote peers
      peersRef.current.forEach(pc => {
        const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (videoSender && externalVideoTrack) videoSender.replaceTrack(externalVideoTrack);
        
        if (mixedAudioTrack) {
          const audioSender = pc.getSenders().find((s) => s.track && s.track.kind === "audio");
          if (audioSender) audioSender.replaceTrack(mixedAudioTrack);
        }
      });
      
      // Replace track locally if requested (for screen sharing, not for media file sharing)
      if (replaceLocalVideo && localStreamRef.current && currentCameraTrack && externalVideoTrack) {
        localStreamRef.current.removeTrack(currentCameraTrack);
        localStreamRef.current.addTrack(externalVideoTrack);
        if (setLocalStream) {
           setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }
      }
      
      setIsScreenSharing(true);
      window.dispatchEvent(new CustomEvent('screenshare-status', { detail: true }));

      if (externalVideoTrack) {
         externalVideoTrack.onended = () => {
           stopSharing();
         };
      }
    } catch (err) {
      console.log("Stream external error:", err);
    }
  }, [localStreamRef, peersRef, setLocalStream, stopSharing]);

  const shareScreen = useCallback(async () => {
    if (isScreenSharing) {
       stopSharing();
       return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true
      });
      
      const currentStream = localStreamRef.current;
      if (currentStream) {
        const { pipStream, cleanup } = await createPiPStream(screenStream, currentStream);
        
        // Save cleanup to context
        shareContext.current.pipCleanup = cleanup;
        
        // For screen share, we replace the local video track with the composite PiP
        startExternalStream(pipStream, true);
        
        // Ensure cleanup runs when external track ends (user stops sharing via browser bar)
        pipStream.getVideoTracks()[0].onended = () => {
          stopSharing();
        };
      } else {
        startExternalStream(screenStream, true);
      }
    } catch (err) {
      console.log("Screen share cancel:", err);
    }
  }, [isScreenSharing, stopSharing, startExternalStream]);

  return {
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    shareScreen,
    stopSharing,
    startExternalStream
  };
}
