import { useEffect, useRef } from "react";

export default function VideoGrid({
  localStream,
  remoteStream,
  connectionState,
  roomId,
  remoteVideoRef,
}) {
  const localVideoRef = useRef(null);

  // We use standard useEffects for both streams to avoid the "black video" glitch
  // caused by conditional rendering and unmounting of video tags.
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef]);

  const isConnected = connectionState === "connected";

  return (
    <div className="flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden relative">
      
      {/* Main Remote Video Tile - Always takes full space */}
      <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-800/60 shadow-lg">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          // Changed to object-contain so screen shares are NEVER cropped!
          className="absolute inset-0 w-full h-full object-contain bg-slate-900"
        />

        {/* Placeholder when no remote */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 z-10">
            <div className="
              h-20 w-20 sm:h-24 sm:w-24 rounded-full
              bg-gradient-to-br from-cyan-600 to-blue-700
              flex items-center justify-center
              text-3xl sm:text-4xl font-semibold mb-4
              shadow-lg
            ">
              ?
            </div>
            <p className="text-slate-300 text-sm sm:text-base font-medium px-4 text-center">
              {connectionState === "connecting"
                ? "Waiting for someone to join..."
                : connectionState === "failed"
                  ? "Connection failed"
                  : "No one else is here yet"}
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Share the Room ID to invite others
            </p>
          </div>
        )}

        {/* Remote user label */}
        {isConnected && (
          <div className="
            absolute bottom-3 left-3 z-20
            bg-black/60 backdrop-blur-md
            px-3 py-1.5 rounded-lg
            text-xs text-white font-medium shadow-md
          ">
            Participant
          </div>
        )}
      </div>

      {/* Self-view floating mini tile - ALWAYS floating like Google Meet */}
      <div className="
        absolute z-30 rounded-xl overflow-hidden
        border-2 border-slate-700/50 shadow-2xl
        bottom-6 right-6 w-32 h-24 sm:w-48 sm:h-32
        transition-transform hover:scale-105
        bg-slate-900
      ">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          // Object cover is fine for your own camera
          className="w-full h-full object-cover"
        />
        <div className="
          absolute bottom-1.5 left-1.5
          bg-black/60 backdrop-blur-sm
          px-2 py-1 rounded-md text-[10px] text-white font-medium
        ">
          You
        </div>
      </div>
    </div>
  );
}
