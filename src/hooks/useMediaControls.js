import { useState, useCallback } from "react";

export default function useMediaControls(localStreamRef, pcRef) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Keep track of the original camera stream so we can restore it
  const [originalStream, setOriginalStream] = useState(null);

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
      const sender = pcRef.current
        ?.getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (!sender) return;

      // Replace the track for the REMOTE user
      await sender.replaceTrack(screenTrack);
      setIsScreenSharing(true);

      // Save a copy of the original stream before modifying
      const origStream = new MediaStream(localStreamRef.current.getTracks());
      setOriginalStream(origStream);

      // Replace the track LOCALLY so YOU can see your screen share
      const originalCameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (originalCameraTrack) {
        localStreamRef.current.removeTrack(originalCameraTrack);
      }
      localStreamRef.current.addTrack(screenTrack);

      // Trigger a re-render to update the local video element
      const event = new Event('streamchanged');
      window.dispatchEvent(event);

      screenTrack.onended = () => {
        if (originalCameraTrack) {
          // Send camera back to remote user
          sender.replaceTrack(originalCameraTrack);
          
          // Show camera back on local video
          localStreamRef.current.removeTrack(screenTrack);
          localStreamRef.current.addTrack(originalCameraTrack);
          
          const event = new Event('streamchanged');
          window.dispatchEvent(event);
        }
        setIsScreenSharing(false);
        setOriginalStream(null);
      };
    } catch (err) {
      if (err.name === "NotAllowedError") {
        console.log("User cancelled screen share");
        return;
      }
      console.error("Screen share error:", err);
    }
  }, [localStreamRef, pcRef, isScreenSharing]);

  return {
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    shareScreen,
  };
}
