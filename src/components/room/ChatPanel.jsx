import { FiX, FiSend } from "react-icons/fi";

export default function ChatPanel({
  chatOpen,
  setChatOpen,
  messages,
  msg,
  setMsg,
  sendMessage,
  messagesEndRef,
}) {
  if (!chatOpen) return null;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        sm:absolute sm:inset-auto sm:right-0 sm:top-0
        sm:h-full sm:w-[360px]
        lg:relative lg:w-[340px] xl:w-[380px]
        bg-slate-900 sm:bg-slate-900/95 sm:backdrop-blur-xl
        sm:border-l sm:border-white/5
        flex flex-col
        animate-[slideIn_0.15s_ease-out]
      "
    >
      {/* Header */}
      <div className="h-12 shrink-0 px-4 flex items-center justify-between border-b border-white/5">
        <h3 className="font-medium text-sm text-white">In-call messages</h3>
        <button
          onClick={() => setChatOpen(false)}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5 active:bg-white/10 transition text-slate-400"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-slate-600 text-center px-4">
              Messages are only visible to people in the call
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prevSender = i > 0 ? messages[i - 1].sender : null;
            const isNewSender = m.sender !== prevSender;

            return (
              <div key={i} className={`${isNewSender ? "pt-3" : "pt-0.5"}`}>
                {isNewSender && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-cyan-400">
                      {m.sender || "Anonymous"}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {m.time ? formatTime(m.time) : ""}
                    </span>
                  </div>
                )}
                <p className="text-sm text-slate-300 leading-relaxed break-words">
                  {m.text}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 pb-safe border-t border-white/5">
        <div className="flex gap-2 items-end">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Send a message"
            className="
              flex-1 bg-slate-800/50 border border-white/5
              rounded-full px-4 py-2.5 outline-none
              focus:border-white/15 text-sm text-white
              placeholder:text-slate-500 transition
            "
          />
          <button
            onClick={sendMessage}
            disabled={!msg.trim()}
            className="
              h-10 w-10 shrink-0 rounded-full
              flex items-center justify-center
              bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400
              disabled:opacity-30 disabled:hover:bg-cyan-600
              transition text-white
            "
          >
            <FiSend size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
