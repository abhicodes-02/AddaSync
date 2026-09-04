import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

function PipGrid({ remoteStreams, localStream }) {
  const localRef = useRef(null);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const streamsEntries = Array.from(remoteStreams.entries());
  const count = streamsEntries.length;

  let gridClass = "count-1";
  if (count === 2) gridClass = "count-2";
  if (count === 3 || count === 4) gridClass = "count-3";
  if (count >= 5) gridClass = "count-5";

  return (
    <>
      <style>
        {`
          body { margin: 0; padding: 0; background: #0a0a0a; overflow: hidden; font-family: sans-serif; }
          .pip-grid {
             display: grid;
             gap: 6px;
             width: 100vw;
             height: 100vh;
             padding: 6px;
             box-sizing: border-box;
          }
          .pip-grid.count-1 { grid-template-columns: 1fr; }
          .pip-grid.count-2 { grid-template-columns: 1fr 1fr; }
          .pip-grid.count-3 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
          .pip-grid.count-5 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; }
          .pip-video-container {
             position: relative;
             width: 100%;
             height: 100%;
             border-radius: 12px;
             overflow: hidden;
             background: #111;
             border: 1px solid rgba(255,255,255,0.1);
          }
          .pip-video { width: 100%; height: 100%; object-fit: cover; }
          
          .local-pip {
             position: absolute;
             bottom: 16px;
             right: 16px;
             width: 28%;
             max-width: 200px;
             min-width: 100px;
             aspect-ratio: 16/9;
             border-radius: 10px;
             overflow: hidden;
             border: 1px solid rgba(255,255,255,0.2);
             box-shadow: 0 10px 25px rgba(0,0,0,0.8);
             z-index: 100;
             background: #000;
          }
          .local-pip video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        `}
      </style>
      <div className={`pip-grid ${gridClass}`}>
        {streamsEntries.map(([uid, stream]) => (
          <div key={uid} className="pip-video-container">
            <video
              autoPlay
              playsInline
              className="pip-video"
              ref={(el) => {
                if (el && el.srcObject !== stream) el.srcObject = stream;
              }}
            />
          </div>
        ))}
      </div>
      <div className="local-pip">
        <video ref={localRef} autoPlay muted playsInline />
      </div>
    </>
  );
}

export default function usePictureInPicture(localVideoRef, remoteStreams, localStream) {
  const [isPiP, setIsPiP] = useState(false);
  const [pipWindow, setPipWindow] = useState(null);
  
  // Fallback Canvas Refs
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

  const startDocPiP = useCallback(async () => {
    try {
      const win = await window.documentPictureInPicture.requestWindow({
        width: 800,
        height: 450,
      });

      win.addEventListener("pagehide", () => {
        setPipWindow(null);
        setIsPiP(false);
      });

      setPipWindow(win);
      setIsPiP(true);
      return true;
    } catch (err) {
      console.warn("Document PiP failed or unsupported:", err);
      return false;
    }
  }, []);

  const startCanvasPiP = useCallback(async () => {
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

      let pWindow = null;

      const drawFrame = () => {
        if (!ctx || !canvasRef.current) return;

        // Dynamic Resize if PIP window exists (Best effort for standard PiP)
        if (pWindow && pWindow.width && pWindow.height) {
            if (canvas.width !== pWindow.width || canvas.height !== pWindow.height) {
                canvas.width = pWindow.width * 1.5;
                canvas.height = pWindow.height * 1.5;
            }
        }

        // Base Background
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const remoteVideos = Array.from(document.querySelectorAll('.remote-video-element'))
                                  .filter(v => v.readyState >= 2);
        
        const count = remoteVideos.length;

        // Grid Drawing Logic
        if (count === 1) {
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
          let cols = 2;
          let rows = Math.ceil(count / 2);
          
          const cellW = canvas.width / cols;
          const cellH = canvas.height / rows;

          remoteVideos.forEach((remote, i) => {
             const row = Math.floor(i / cols);
             const col = i % cols;
             const x = col * cellW;
             const y = row * cellH;

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

        // Draw Local
        const local = localVideoRef.current;
        if (local && local.readyState >= 2) {
          const padding = 20;
          const pipW = Math.max(150, canvas.width * 0.25);
          const pipH = pipW * (9/16);
          const pipX = canvas.width - pipW - padding;
          const pipY = canvas.height - pipH - padding;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 15;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
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
      pWindow = await pipVideo.requestPictureInPicture();
      setIsPiP(true);

      pipVideo.addEventListener('leavepictureinpicture', stopPiP);

    } catch (err) {
      console.error("Failed to start Canvas PiP:", err);
      stopPiP();
    }
  }, [localVideoRef]);

  const togglePiP = useCallback(async () => {
    if (pipWindow) {
       pipWindow.close();
       return;
    }
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      stopPiP();
      return;
    }

    if ('documentPictureInPicture' in window) {
      const success = await startDocPiP();
      if (success) return;
    }
    
    await startCanvasPiP();
  }, [startCanvasPiP, startDocPiP, stopPiP, pipWindow]);

  // Handle automatic PIP on tab switch (Video PiP is usually more reliable for automatic trigger, but Doc PiP is user triggered)
  useEffect(() => {
    const handleVisibility = async () => {
      if (
        document.hidden &&
        !pipWindow &&
        !document.pictureInPictureElement
      ) {
        // Document PiP API must be user-gesture initiated. Automatic tab switch PiP requires standard video PiP.
        if (document.pictureInPictureEnabled) {
          await startCanvasPiP();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startCanvasPiP, pipWindow]);

  useEffect(() => {
    return () => {
       stopPiP();
       if (pipWindow) pipWindow.close();
    };
  }, [stopPiP, pipWindow]);

  const PiPPortal = pipWindow ? createPortal(<PipGrid remoteStreams={remoteStreams} localStream={localStream} />, pipWindow.document.body) : null;

  return { isPiP, togglePiP, PiPPortal };
}
