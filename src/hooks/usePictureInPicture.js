import { useState, useEffect, useCallback, useRef } from "react";

export default function usePictureInPicture(localVideoRef, remoteVideoRef) {
  const [isPiP, setIsPiP] = useState(false);
  const pipVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const stopPiP = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject?.getTracks().forEach(t => t.stop());
      pipVideoRef.current = null;
    }
    if (canvasRef.current) {
      canvasRef.current = null;
    }
    setIsPiP(false);
  }, []);

  const startCompositePiP = useCallback(async () => {
    try {
      if (!localVideoRef.current || !remoteVideoRef.current) return;
      if (document.pictureInPictureElement) return;

      // 1. Create a hidden Canvas (720p 16:9)
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      canvasRef.current = canvas;

      // 2. Create a hidden video element to feed to PiP
      const pipVideo = document.createElement("video");
      pipVideo.muted = true;
      pipVideo.playsInline = true;
      pipVideoRef.current = pipVideo;

      // 3. Render Loop - Composites both videos into one frame
      const drawFrame = () => {
        if (!ctx || !canvasRef.current) return;

        // Base Background
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Remote Video (Simulate object-contain)
        const remote = remoteVideoRef.current;
        if (remote && remote.readyState >= 2) {
          const rRatio = remote.videoWidth / remote.videoHeight;
          const cRatio = canvas.width / canvas.height;
          let drawW, drawH, drawX, drawY;

          if (rRatio > cRatio) {
            drawW = canvas.width;
            drawH = canvas.width / rRatio;
            drawX = 0;
            drawY = (canvas.height - drawH) / 2;
          } else {
            drawH = canvas.height;
            drawW = canvas.height * rRatio;
            drawX = (canvas.width - drawW) / 2;
            drawY = 0;
          }
          ctx.drawImage(remote, drawX, drawY, drawW, drawH);
        }

        // Draw Local Video (Floating bottom right, simulate object-cover)
        const local = localVideoRef.current;
        if (local && local.readyState >= 2) {
          const padding = 40;
          const pipW = 320;
          const pipH = 180;
          const pipX = canvas.width - pipW - padding;
          const pipY = canvas.height - pipH - padding;

          ctx.save();
          
          // Add border and drop shadow
          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 12;
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.strokeRect(pipX, pipY, pipW, pipH);
          
          // Clip path for local video
          ctx.beginPath();
          ctx.rect(pipX, pipY, pipW, pipH);
          ctx.clip();
          
          const vRatio = local.videoWidth / local.videoHeight;
          const boxRatio = pipW / pipH;
          let sW, sH, sX, sY;
          
          if (vRatio > boxRatio) {
            sH = local.videoHeight;
            sW = local.videoHeight * boxRatio;
            sX = (local.videoWidth - sW) / 2;
            sY = 0;
          } else {
            sW = local.videoWidth;
            sH = local.videoWidth / boxRatio;
            sX = 0;
            sY = (local.videoHeight - sH) / 2;
          }
          
          ctx.drawImage(local, sX, sY, sW, sH, pipX, pipY, pipW, pipH);
          ctx.restore();
        }

        animationRef.current = requestAnimationFrame(drawFrame);
      };
      
      animationRef.current = requestAnimationFrame(drawFrame);

      // 4. Extract stream and push to hidden video
      const stream = canvas.captureStream(30);
      pipVideo.srcObject = stream;
      
      await pipVideo.play();
      
      // 5. Native Browser PiP trigger
      await pipVideo.requestPictureInPicture();
      setIsPiP(true);

      // Cleanup if user clicks the native 'x' on the PiP window
      pipVideo.addEventListener('leavepictureinpicture', stopPiP);

    } catch (err) {
      console.error("Failed to start Composite PiP:", err);
      stopPiP();
    }
  }, [localVideoRef, remoteVideoRef, stopPiP]);

  const togglePiP = useCallback(async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      stopPiP();
    } else {
      await startCompositePiP();
    }
  }, [startCompositePiP, stopPiP]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (
        document.hidden &&
        document.pictureInPictureEnabled &&
        !document.pictureInPictureElement
      ) {
        await startCompositePiP();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startCompositePiP]);

  useEffect(() => {
    return () => stopPiP();
  }, [stopPiP]);

  return { isPiP, togglePiP };
}
