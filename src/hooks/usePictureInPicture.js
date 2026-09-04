import { useState, useEffect, useCallback } from "react";

export default function usePictureInPicture(remoteVideoRef) {
  const [isPiP, setIsPiP] = useState(false);

  useEffect(() => {
    const handleVisibility = async () => {
      try {
        if (
          document.hidden &&
          remoteVideoRef.current &&
          document.pictureInPictureEnabled &&
          !document.pictureInPictureElement
        ) {
          await remoteVideoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.log("PiP auto-enter failed:", err);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [remoteVideoRef]);

  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video) return;

    const enter = () => setIsPiP(true);
    const leave = () => setIsPiP(false);

    video.addEventListener("enterpictureinpicture", enter);
    video.addEventListener("leavepictureinpicture", leave);

    return () => {
      video.removeEventListener("enterpictureinpicture", enter);
      video.removeEventListener("leavepictureinpicture", leave);
    };
  }, [remoteVideoRef]);

  const togglePiP = useCallback(async () => {
    try {
      if (remoteVideoRef.current && !document.pictureInPictureElement) {
        await remoteVideoRef.current.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (err) {
      console.log("PiP toggle failed:", err);
    }
  }, [remoteVideoRef]);

  return { isPiP, togglePiP };
}
