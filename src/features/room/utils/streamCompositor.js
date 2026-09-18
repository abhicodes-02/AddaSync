export function createPiPStream(screenStream, cameraStream) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    // Standard 1080p canvas for high quality
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");

    const screenVideo = document.createElement("video");
    screenVideo.autoplay = true;
    screenVideo.muted = true;
    screenVideo.playsInline = true;
    screenVideo.srcObject = screenStream;

    const cameraVideo = document.createElement("video");
    cameraVideo.autoplay = true;
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;
    cameraVideo.srcObject = cameraStream;

    let animationId = null;

    const draw = () => {
      // Draw screen share filling the canvas
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      // Draw camera in bottom right as a circle (PiP)
      if (cameraStream && cameraStream.getVideoTracks().length > 0 && cameraStream.getVideoTracks()[0].enabled) {
        const pipSize = 300; // Diameter of the PiP circle
        const margin = 40;
        const cx = canvas.width - pipSize / 2 - margin;
        const cy = canvas.height - pipSize / 2 - margin;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, pipSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        
        // Add a nice border and shadow for the PiP
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.fill(); // fill shadow
        ctx.clip(); // clip to circle

        // Draw camera video centered in the circle (assuming 16:9 or 4:3)
        // To cover the circle, we scale it
        const aspect = cameraVideo.videoWidth / cameraVideo.videoHeight || 16/9;
        let drawW, drawH;
        if (aspect > 1) {
          drawH = pipSize;
          drawW = pipSize * aspect;
        } else {
          drawW = pipSize;
          drawH = pipSize / aspect;
        }
        
        // Also flip horizontally since it's a front camera
        ctx.translate(cx, cy);
        ctx.scale(-1, 1);
        ctx.drawImage(
          cameraVideo, 
          -drawW / 2, 
          -drawH / 2, 
          drawW, 
          drawH
        );
        ctx.restore();
        
        // Draw outline
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, pipSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#06b6d4"; // cyan-500
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    // Start drawing when screen video is ready
    screenVideo.onloadedmetadata = () => {
      screenVideo.play();
      cameraVideo.play();
      draw();
      
      const pipStream = canvas.captureStream(30); // 30 FPS
      
      // Also add the audio track from the screen stream (if any)
      const screenAudio = screenStream.getAudioTracks()[0];
      if (screenAudio) {
        pipStream.addTrack(screenAudio);
      }

      const cleanup = () => {
        if (animationId) cancelAnimationFrame(animationId);
        screenVideo.pause();
        screenVideo.srcObject = null;
        cameraVideo.pause();
        cameraVideo.srcObject = null;
      };

      resolve({ pipStream, cleanup });
    };
  });
}

