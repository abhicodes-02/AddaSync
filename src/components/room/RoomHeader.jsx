import { FiCopy, FiMessageSquare, FiUsers } from "react-icons/fi";
import { useToast } from "../ui/Toast";

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
  onLeave,
}) {
  const addToast = useToast();

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    addToast("Room ID copied!", "success");
  };

  const stateInfo = STATE_LABELS[connectionState] || STATE_LABELS.new;
  const isConnected = connectionState === "connected";
  const participantCount = isConnected ? 2 : 1;

  return (
    <header className="h-12 sm:h-14 shrink-0 bg-slate-900/60 backdrop-blur-md px-2 sm:px-4 flex items-center justify-between">

      {/* Left — meeting info */}
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <div className={`w-2 h-2 shrink-0 rounded-full ${stateInfo.color}`} />
        <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[100px] sm:max-w-none">
          {roomId}
        </span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1">

        {/* Copy ID — mobile tap icon, desktop shows label */}
        <button
          onClick={copyRoomId}
          title="Copy Room ID"
          className="
            h-8 w-8 sm:h-9 sm:w-auto sm:px-3
            flex items-center justify-center gap-1.5
            rounded-full text-slate-300
            hover:bg-white/5 active:bg-white/10 transition
          "
        >
          <FiCopy size={14} />
          <span className="hidden sm:inline text-xs">Copy</span>
        </button>

        {/* Participants */}
        <div className="
          h-8 flex items-center gap-1
          px-2 rounded-full text-xs text-slate-400
        ">
          <FiUsers size={13} />
          <span>{participantCount}</span>
        </div>

        {/* Chat toggle */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          title="Chat"
          className={`
            h-8 w-8 sm:h-9 sm:w-9
            flex items-center justify-center
            rounded-full transition
            ${chatOpen
              ? "bg-cyan-600/20 text-cyan-400"
              : "text-slate-300 hover:bg-white/5 active:bg-white/10"
            }
          `}
        >
          <FiMessageSquare size={15} />
        </button>

        {/* Leave */}
        <button
          onClick={onLeave}
          className="
            h-8 px-3 sm:px-4 ml-1 rounded-full
            bg-red-600 hover:bg-red-500 active:bg-red-400
            transition text-xs sm:text-sm font-medium text-white
          "
        >
          Leave
        </button>
      </div>
    </header>
  );
}
