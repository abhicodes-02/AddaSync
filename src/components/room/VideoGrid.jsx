import { useEffect, useRef } from "react";

export default function VideoGrid({
  localStream,
  remoteStream,
  connectionState,
  roomId,
  remoteVideoRef,
}) {
  const localVideoRef = useRef(null);

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
    <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-2 p-2 sm:p-3 overflow-hidden relative">

      {/* Remote video tile — always takes most space */}
      <div className="flex-1 relative rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/60 min-h-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-slate-900"
        />

        {/* Placeholder when no remote */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90">
            <div className="
              h-16 w-16 sm:h-20 sm:w-20 rounded-full
              bg-gradient-to-br from-cyan-600 to-blue-700
              flex items-center justify-center
              text-2xl sm:text-3xl font-semibold mb-3
            ">
              ?
            </div>
            <p className="text-slate-400 text-xs sm:text-sm text-center px-4">
              {connectionState === "connecting"
                ? "Waiting for someone to join..."
                : connectionState === "failed"
                  ? "Connection failed"
                  : "No one else is here yet"}
            </p>
            <p className="text-slate-500 text-[10px] sm:text-xs mt-1.5">
              Share the Room ID to invite others
            </p>
          </div>
        )}

        {/* Remote user label */}
        <div className="
          absolute bottom-2 left-2 sm:bottom-3 sm:left-3
          bg-black/60 backdrop-blur-sm
          px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg
          text-[10px] sm:text-xs text-white
        ">
          Participant
        </div>
      </div>

      {/* Local video — side-by-side on desktop when connected */}
      {isConnected && (
        <div className="
          hidden lg:block relative rounded-xl overflow-hidden
          bg-slate-800/60 w-[35%] max-w-[450px] min-h-0
        ">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="
            absolute bottom-3 left-3
            bg-black/60 backdrop-blur-sm
            px-3 py-1.5 rounded-lg text-xs text-white
          ">
            You
          </div>
        </div>
      )}

      {/* Self-view floating mini tile — mobile & tablet, or when alone on desktop */}
      <div className={`
        absolute z-30 rounded-lg sm:rounded-xl overflow-hidden
        border border-white/10 shadow-xl
        ${isConnected
          ? "lg:hidden bottom-2 right-2 w-28 h-20 sm:w-36 sm:h-24"
          : "bottom-2 right-2 w-28 h-20 sm:w-36 sm:h-24 md:w-44 md:h-28"
        }
      `}>
        <video
          ref={(el) => {
            if (el && localStream) el.srcObject = localStream;
          }}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover bg-slate-900"
        />
        <div className="
          absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5
          bg-black/60 backdrop-blur-sm
          px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] text-white
        ">
          You
        </div>
      </div>
    </div>
  );
}
