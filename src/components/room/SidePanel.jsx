import { memo } from "react";
import { FiX, FiSend, FiMessageCircle, FiUsers } from "react-icons/fi";

const SidePanel = memo(function SidePanel({
  activeTab,
  setActiveTab,
  messages,
  msg,
  setMsg,
  sendMessage,
  messagesStartRef,
  userName,
  participantNames
}) {
  if (!activeTab) return null;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const allParticipants = [
    { id: "local", name: `${userName} (You)` },
    ...Array.from(participantNames.entries()).map(([id, name]) => ({ id, name }))
  ];

  return (
    <div className="
        absolute lg:relative right-0 top-0
        h-full w-full sm:w-[380px]
        backdrop-blur-3xl bg-slate-900/80
        border-l border-white/5 shadow-2xl
        flex flex-col z-50
        animate-[slideIn_0.2s_ease-out]
      "
    >
      {/* Header & Tabs */}
      <div className="shrink-0 flex flex-col border-b border-white/5 bg-white/[0.01]">
        <div className="h-16 px-5 flex items-center justify-between">
          <h3 className="font-semibold text-white tracking-wide">
            {activeTab === "chat" ? "Meeting Chat" : "Participants"}
          </h3>
          <button
            onClick={() => setActiveTab(null)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <FiX size={16} />
          </button>
        </div>
        <div className="flex px-4 gap-4">
          <button
            onClick={() => setActiveTab("chat")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "chat" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("people")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "people" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            People <span className="bg-white/10 px-1.5 py-0.5 rounded-md text-[10px]">{allParticipants.length}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col">
        {activeTab === "chat" ? (
          <>
            <div className="flex-1 p-4 space-y-4 flex flex-col">
              <div ref={messagesStartRef} />
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 mt-10">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <FiMessageCircle size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-slate-600 text-center px-8">
                    Messages here are visible to everyone in the call.
                  </p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.sender === userName;
                  const newerMsgSender = i > 0 ? messages[i - 1].sender : null;
                  const showHeader = m.sender !== newerMsgSender;

                  return (
                    <div key={m.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${showHeader ? "mt-4" : "mt-1.5"}`}>
                      {showHeader && (
                        <span className="text-[11px] font-medium text-slate-400 mb-1.5 px-1">
                          {isMe ? "You" : m.sender || "Anonymous"} • {m.time ? formatTime(m.time) : ""}
                        </span>
                      )}
                      <div className={`
                        max-w-[85%] px-4 py-2.5 text-sm leading-relaxed
                        ${isMe 
                          ? "bg-cyan-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-cyan-900/20" 
                          : "bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-sm border border-white/5 shadow-sm"
                        }
                      `}>
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="shrink-0 p-4 bg-white/[0.01] border-t border-white/5 pb-safe mt-auto">
              <div className="flex gap-2 items-end bg-black/40 rounded-[1.25rem] border border-white/10 p-1.5 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
                <input
                  id="chatMessage"
                  name="chatMessage"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Send a message..."
                  className="
                    flex-1 bg-transparent px-3 py-2 outline-none
                    text-sm text-white placeholder:text-slate-500
                  "
                  autoComplete="off"
                />
                <button
                  onClick={sendMessage}
                  disabled={!msg.trim()}
                  className="
                    h-9 w-9 shrink-0 rounded-xl
                    flex items-center justify-center
                    bg-cyan-500 hover:bg-cyan-400 active:scale-95
                    disabled:opacity-30 disabled:hover:bg-cyan-500
                    transition-all text-white shadow-md shadow-cyan-500/20
                  "
                >
                  <FiSend size={15} className="ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 p-4 space-y-2">
            {allParticipants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default SidePanel;
