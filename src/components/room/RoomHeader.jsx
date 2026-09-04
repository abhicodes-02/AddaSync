import { FiCopy, FiMessageCircle, FiUsers, FiMail } from "react-icons/fi";
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
  activeTab,
  setActiveTab,
  participantsCount = 1
}) {
  const addToast = useToast();
  const stateInfo = STATE_LABELS[connectionState] || STATE_LABELS.new;
  const isConnected = connectionState === "connected";
  
  const fullUrl = `${window.location.origin}/room/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    addToast("Meeting link copied!", "success");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Join my MeetFlow Video Call`);
    const body = encodeURIComponent(`I'm inviting you to a video meeting.\n\nClick this link to join directly:\n${fullUrl}\n\nOr enter the room code manually: ${roomId}`);
    
    // Explicitly open Gmail in a new tab
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <>
      {/* Bottom Left: Info & Sharing */}
      <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-6 z-40 flex items-center gap-3 sm:gap-4 h-11 sm:h-12 pl-1.5 pr-4 sm:pr-5 rounded-full backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="MeetFlow" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-sm font-semibold text-white tracking-wide">
            {roomId}
          </span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <button
          onClick={handleCopyLink}
          title="Copy direct invite link"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <FiCopy size={13} />
          <span className="hidden sm:inline">Copy Link</span>
        </button>

        <button
          onClick={handleEmailShare}
          title="Send email invite"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors ml-1 sm:ml-2"
        >
          <FiMail size={14} />
          <span className="hidden sm:inline">Email</span>
        </button>
      </div>

      {/* Bottom Right: Participants & Chat Toggle */}
      <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-6 z-40 flex items-center gap-1 p-1 rounded-full backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-2xl hidden sm:flex">
        <button
          onClick={() => setActiveTab(activeTab === "people" ? null : "people")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${
            activeTab === "people"
              ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              : "hover:bg-white/10 text-slate-300 hover:text-white"
          }`}
          title="Participants"
        >
          <FiUsers size={14} />
          <span>{participantsCount}</span>
        </button>
        <button
          onClick={() => setActiveTab(activeTab === "chat" ? null : "chat")}
          className={`h-9 w-9 flex items-center justify-center rounded-full transition-all ${
            activeTab === "chat"
              ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              : "hover:bg-white/10 text-slate-300 hover:text-white"
          }`}
          title="Toggle Chat"
        >
          <FiMessageCircle size={15} />
        </button>
      </div>
    </>
  );
}
