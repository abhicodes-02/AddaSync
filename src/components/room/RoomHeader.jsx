import { FiCopy, FiMessageCircle, FiUsers, FiMail } from "react-icons/fi";
import { memo } from "react";
import { useToast } from "../ui/Toast";

const STATE_LABELS = {
  new: { text: "Initializing", color: "bg-yellow-500" },
  connecting: { text: "Connecting...", color: "bg-yellow-500 animate-pulse" },
  connected: { text: "Connected", color: "bg-emerald-500" },
  disconnected: { text: "Reconnecting...", color: "bg-red-500 animate-pulse" },
  failed: { text: "Failed", color: "bg-red-500" },
};

const RoomHeader = memo(function RoomHeader({
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
    const subject = encodeURIComponent(`📅 You're invited to an AddaSync Meeting!`);
    const bodyText = `Hi there,\n\nYou have been invited to join a secure video conference on AddaSync.\n\n🚀 JOIN MEETING NOW:\n${fullUrl}\n\n-------------------------------------------------\n📌 Meeting Details:\n• Room Code: ${roomId}\n• Platform: AddaSync (No installation required)\n-------------------------------------------------\n\nTo join, simply click the link above from any web browser on your computer or mobile device.\n\nSee you in the meeting!`;
    const body = encodeURIComponent(bodyText);
    
    // Explicitly open Gmail with pre-filled reliable plain text
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <>
      {/* Mobile Top Bar (Hidden on Desktop) */}
      <div className="sm:hidden absolute top-4 left-4 right-4 z-40 flex items-center justify-between h-12 px-3 rounded-2xl backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="AddaSync Logo" className="w-7 h-7 rounded-lg object-cover shadow-sm" />
          <span className="text-xs font-semibold text-white tracking-wide truncate max-w-[90px]">{roomId}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopyLink} className="text-slate-300 hover:text-white p-2 active:scale-95 transition-all">
            <FiCopy size={16} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button 
            onClick={() => setActiveTab(activeTab === "people" ? null : "people")} 
            className={`p-2 active:scale-95 transition-all ${activeTab === 'people' ? 'text-cyan-400' : 'text-slate-300'}`}
          >
            <FiUsers size={16} />
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === "chat" ? null : "chat")} 
            className={`p-2 active:scale-95 transition-all ${activeTab === 'chat' ? 'text-cyan-400' : 'text-slate-300'}`}
          >
            <FiMessageCircle size={16} />
          </button>
        </div>
      </div>

      {/* Desktop Bottom Left: Info & Sharing (Hidden on Mobile) */}
      <div className="hidden sm:flex absolute bottom-8 left-6 z-40 items-center gap-4 h-12 pl-1.5 pr-5 rounded-full backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-2xl">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-0.5 flex items-center justify-center shadow-lg overflow-hidden">
          <img src="/logo.jpg" alt="AddaSync Logo" className="w-full h-full object-cover rounded-[0.6rem]" />
        </div>
        <span className="text-white font-bold tracking-wide text-lg sm:text-xl hidden sm:block">AddaSync</span>
        <div className="w-px h-4 bg-white/10" />
        <button onClick={handleCopyLink} title="Copy direct invite link" className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors">
          <FiCopy size={13} />
          <span>Copy Link</span>
        </button>
        <button onClick={handleEmailShare} title="Send email invite" className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors ml-2">
          <FiMail size={14} />
          <span>Email</span>
        </button>
      </div>

      {/* Desktop Bottom Right: Participants & Chat Toggle (Hidden on Mobile) */}
      <div className="hidden sm:flex absolute bottom-8 right-6 z-40 items-center gap-1 p-1 rounded-full backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-2xl">
        <button
          onClick={() => setActiveTab(activeTab === "people" ? null : "people")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${
            activeTab === "people" ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "hover:bg-white/10 text-slate-300 hover:text-white"
          }`}
          title="Participants"
        >
          <FiUsers size={14} />
          <span>{participantsCount}</span>
        </button>
        <button
          onClick={() => setActiveTab(activeTab === "chat" ? null : "chat")}
          className={`h-9 w-9 flex items-center justify-center rounded-full transition-all ${
            activeTab === "chat" ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "hover:bg-white/10 text-slate-300 hover:text-white"
          }`}
          title="Toggle Chat"
        >
          <FiMessageCircle size={15} />
        </button>
      </div>
    </>
  );
});

export default RoomHeader;
