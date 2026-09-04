import { useState, useEffect, useCallback, useRef } from "react";

export default function usePictureInPicture(localVideoRef, remoteStreams) {
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
      if (document.pictureInPictureElement) return;

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      canvasRef.current = canvas;

      const pipVideo = document.createElement("video");
      pipVideo.muted = true;
      pipVideo.playsInline = true;
      pipVideoRef.current = pipVideo;

      const drawFrame = () => {
        if (!ctx || !canvasRef.current) return;

        // Base Background
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Get all active remote video elements from the DOM
        const remoteVideos = Array.from(document.querySelectorAll('.remote-video-element'))
                                  .filter(v => v.readyState >= 2);
        
        const count = remoteVideos.length;

        // Draw Remote Videos in a Grid
        if (count === 1) {
          // Single Remote Video (Full Screen)
          const remote = remoteVideos[0];
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
        } else if (count > 1) {
          // Multiple Remote Videos Grid
          let cols = 2;
          let rows = Math.ceil(count / 2);
          
          const cellW = canvas.width / cols;
          const cellH = canvas.height / rows;

          remoteVideos.forEach((remote, i) => {
             const row = Math.floor(i / cols);
             const col = i % cols;
             const x = col * cellW;
             const y = row * cellH;

             // object-cover simulation for grid cells
             ctx.save();
             ctx.beginPath();
             ctx.rect(x, y, cellW, cellH);
             ctx.clip();

             const vRatio = remote.videoWidth / remote.videoHeight;
             const boxRatio = cellW / cellH;
             let sW, sH, sX, sY;

             if (vRatio > boxRatio) {
               sH = remote.videoHeight;
               sW = remote.videoHeight * boxRatio;
               sX = (remote.videoWidth - sW) / 2;
               sY = 0;
             } else {
               sW = remote.videoWidth;
               sH = remote.videoWidth / boxRatio;
               sX = 0;
               sY = (remote.videoHeight - sH) / 2;
             }
             
             ctx.drawImage(remote, sX, sY, sW, sH, x, y, cellW, cellH);
             ctx.restore();
          });
        }

        // Draw Local Video (Floating bottom right)
        const local = localVideoRef.current;
        if (local && local.readyState >= 2) {
          const padding = 40;
          const pipW = 320;
          const pipH = 180;
          const pipX = canvas.width - pipW - padding;
          const pipY = canvas.height - pipH - padding;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 12;
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.strokeRect(pipX, pipY, pipW, pipH);
          
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
          
          // Apply horizontal mirror specifically for PiP local view
          ctx.translate(pipX + pipW, pipY);
          ctx.scale(-1, 1);
          
          ctx.drawImage(local, sX, sY, sW, sH, 0, 0, pipW, pipH);
          ctx.restore();
        }

        animationRef.current = requestAnimationFrame(drawFrame);
      };
      
      animationRef.current = requestAnimationFrame(drawFrame);

      const stream = canvas.captureStream(30);
      pipVideo.srcObject = stream;
      
      await pipVideo.play();
      await pipVideo.requestPictureInPicture();
      setIsPiP(true);

      pipVideo.addEventListener('leavepictureinpicture', stopPiP);

    } catch (err) {
      console.error("Failed to start Composite PiP:", err);
      stopPiP();
    }
  }, [localVideoRef]); // remoteStreams acts as a trigger but we query DOM.

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
