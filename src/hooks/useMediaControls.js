import { useState, useCallback } from "react";

export default function useMediaControls(localStreamRef, peersRef) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, [localStreamRef]);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
  }, [localStreamRef]);

  const shareScreen = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Find and stop the screen track specifically
        const currentTracks = localStreamRef.current?.getVideoTracks() || [];
        const screenTrack = currentTracks.find(t => t.label.toLowerCase().includes('screen') || t.label.toLowerCase().includes('window') || t.label.toLowerCase().includes('display'));
        
        if (screenTrack) {
          screenTrack.stop();
          screenTrack.dispatchEvent(new Event("ended"));
        } else {
          setIsScreenSharing(false);
        }
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true
      });

      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const currentCameraTrack = localStreamRef.current?.getVideoTracks()[0];

      // Replace track for remote peers
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenVideoTrack);
      });
      
      // Replace track locally so late-joiners and local-preview get it
      if (localStreamRef.current && currentCameraTrack) {
        localStreamRef.current.removeTrack(currentCameraTrack);
        localStreamRef.current.addTrack(screenVideoTrack);
      }
      
      setIsScreenSharing(true);
      window.dispatchEvent(new CustomEvent('screenshare-status', { detail: true }));

      screenVideoTrack.onended = () => {
        if (currentCameraTrack) {
          // Restore camera for remote peers
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(currentCameraTrack);
          });

          // Restore camera locally
          if (localStreamRef.current) {
            localStreamRef.current.removeTrack(screenVideoTrack);
            localStreamRef.current.addTrack(currentCameraTrack);
          }
        }
        setIsScreenSharing(false);
        window.dispatchEvent(new CustomEvent('screenshare-status', { detail: false }));
      };
    } catch (err) {
      console.log("Screen share error or cancel:", err);
    }
  }, [localStreamRef, peersRef, isScreenSharing]);

  return {
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    shareScreen,
  };
}
