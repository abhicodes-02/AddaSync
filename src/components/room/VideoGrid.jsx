import { useEffect, useRef } from "react";

function RemoteVideo({ stream, isConnected }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 backdrop-blur-xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`remote-video-element w-full h-full ${isConnected ? "object-contain" : "object-cover"} bg-[#0a0a0a] transition-all duration-700`}
      />
      <div className="
        absolute bottom-4 left-4 z-20
        backdrop-blur-md bg-black/40
        px-3 py-1.5 rounded-xl border border-white/10
        text-xs text-white font-medium shadow-xl
      ">
        Participant
      </div>
    </div>
  );
}

export default function VideoGrid({
  localStream,
  remoteStreams,
  connectionState,
  roomId,
  localVideoRef,
}) {
  useEffect(() => {
    const updateLocalStream = () => {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.srcObject = localStream;
      }
    };
    updateLocalStream();
    window.addEventListener('streamchanged', updateLocalStream);
    return () => window.removeEventListener('streamchanged', updateLocalStream);
  }, [localStream, localVideoRef]);

  const isConnected = connectionState === "connected";
  const streamsArray = Array.from(remoteStreams.values());
  const count = streamsArray.length;

  // Determine optimal grid layout
  let gridCols = "grid-cols-1";
  if (count === 2) gridCols = "sm:grid-cols-2 grid-cols-1";
  if (count === 3 || count === 4) gridCols = "sm:grid-cols-2 grid-cols-1 sm:grid-rows-2";
  if (count >= 5) gridCols = "sm:grid-cols-3 grid-cols-1 sm:grid-rows-2";

  return (
    <div className="flex-1 w-full h-full relative bg-[#0a0a0a]">
      
      {/* Dynamic Remote Videos Grid */}
      <div className={`absolute inset-0 p-4 sm:p-6 pb-32 sm:pb-32 grid gap-4 ${gridCols} ${count > 0 ? "z-10" : "z-0"}`}>
        {count === 0 && isConnected ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full" />
              <div className="
                relative h-24 w-24 sm:h-32 sm:w-32 rounded-full
                bg-gradient-to-br from-slate-800 to-slate-900
                border border-white/5
                flex items-center justify-center
                text-4xl sm:text-5xl font-light text-slate-300
                shadow-2xl mb-6
              ">
                ?
              </div>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-semibold mb-2">
              Waiting for others
            </h2>
            <p className="text-slate-400 text-sm max-w-xs text-center">
              Share the room code <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">{roomId}</span> to start.
            </p>
          </div>
        ) : (
          streamsArray.map((stream) => (
            <RemoteVideo key={stream.id} stream={stream} isConnected={isConnected} />
          ))
        )}
      </div>

      {/* Cinematic Gradients */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-20" />

      {/* Self-view floating mini tile */}
      <div className="
        absolute z-30 overflow-hidden
        border border-white/10 shadow-2xl shadow-black/50
        bottom-28 sm:bottom-32 right-4 sm:right-8 w-32 h-44 sm:w-56 sm:h-36
        rounded-2xl transition-transform hover:scale-[1.02] duration-300
        bg-slate-900
      ">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="
          absolute bottom-3 left-3
          backdrop-blur-md bg-black/50
          px-2.5 py-1 rounded-md text-[11px] text-white font-medium
          border border-white/10
        ">
          You
        </div>
      </div>
    </div>
  );
}
