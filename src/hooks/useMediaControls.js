import { useState, useCallback } from "react";

export default function useMediaControls(localStreamRef, pcRef) {
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
      // If already sharing, trigger the stop logic manually
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

      // Find original camera track
      const originalCameraTrack = localStreamRef.current?.getVideoTracks()[0];

      // Replace the track LOCALLY so YOU can see your screen share
      if (originalCameraTrack) {
        localStreamRef.current.removeTrack(originalCameraTrack);
        localStreamRef.current.addTrack(screenTrack);
      }

      // Handle when user clicks "Stop Sharing" in browser popup
      screenTrack.onended = () => {
        if (originalCameraTrack) {
          // Send camera back to remote user
          sender.replaceTrack(originalCameraTrack);
          
          // Show camera back on local video
          localStreamRef.current.removeTrack(screenTrack);
          localStreamRef.current.addTrack(originalCameraTrack);
        }
        setIsScreenSharing(false);
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
