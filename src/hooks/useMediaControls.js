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
        const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (currentVideoTrack) {
          currentVideoTrack.stop();
          currentVideoTrack.dispatchEvent(new Event("ended"));
        }
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace the track for ALL REMOTE users in the mesh
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        const originalCameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (originalCameraTrack) {
          // Restore camera for ALL remote users
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(originalCameraTrack);
          });
        }
        setIsScreenSharing(false);
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
