import { FiCopy, FiMessageSquare, FiUsers } from "react-icons/fi";
import { useToast } from "../ui/Toast";
import { FiMessageCircle } from "react-icons/fi";

const STATE_LABELS = {
  new: { text: "Initializing", color: "bg-yellow-500" },
  connecting: { text: "Connecting...", color: "bg-yellow-500 animate-pulse" },
  connected: { text: "Connected", color: "bg-emerald-500" },
  disconnected: { text: "Reconnecting...", color: "bg-red-500 animate-pulse" },
  failed: { text: "Failed", color: "bg-red-500" },
};

export default function RoomHeader({
  roomId,
  connectionState,
  chatOpen,
  setChatOpen,
}) {
  const addToast = useToast();
  const stateInfo = STATE_LABELS[connectionState] || STATE_LABELS.new;
  const isConnected = connectionState === "connected";

  return (
    <header className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3">
      {/* Main Info Pill */}
      <div className="flex items-center gap-3 sm:gap-4 h-11 sm:h-12 px-4 sm:px-5 rounded-full backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${stateInfo.color}`} />
          <span className="text-sm font-semibold text-white tracking-wide">
            {roomId}
          </span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <button
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            addToast("Room ID copied!", "success");
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <FiCopy size={13} />
          <span className="hidden sm:inline">Copy</span>
        </button>
      </div>

      {/* Tools Pill */}
      <div className="flex items-center h-11 sm:h-12 px-2 sm:px-2.5 rounded-full backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-1.5 px-3 text-slate-300">
          <FiUsers size={14} />
          <span className="text-xs font-medium">{isConnected ? 2 : 1}</span>
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full transition-all ${
            chatOpen
              ? "bg-cyan-500/20 text-cyan-400"
              : "hover:bg-white/10 text-slate-300 hover:text-white"
          }`}
        >
          <FiMessageCircle size={15} />
        </button>
      </div>
    </header>
  );
}
