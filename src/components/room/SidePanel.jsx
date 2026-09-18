import { memo, useState, useRef } from "react";
import { FiX, FiSend, FiMessageCircle, FiUsers, FiPaperclip, FiDownload, FiFile } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Draggable from "react-draggable";

const SidePanel = memo(function SidePanel({
  activeTab,
  setActiveTab,
  messages,
  msg,
  setMsg,
  sendMessage,
  sendFile,
  messagesStartRef,
  userName,
  participantNames,
  isHost,
  roomState,
  adminActions
}) {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const allParticipants = [
    { id: "local", name: `${userName} (You)` },
    ...Array.from(participantNames.entries()).map(([id, name]) => ({ id, name }))
  ];

  const fileInputRef = useRef(null);
  const dragNodeRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async (file) => {
    if (!sendFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await sendFile(file, (p) => setUploadProgress(p));
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <AnimatePresence>
      {activeTab && (
        <Draggable
          nodeRef={dragNodeRef}
          handle=".drag-handle"
          bounds="parent"
        >
          <motion.div
            ref={dragNodeRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="
              theme-ui absolute right-4 sm:right-8 top-24
              h-[calc(100vh-140px)] w-full sm:w-[380px]
              backdrop-blur-3xl bg-slate-900/90
              border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]
              flex flex-col z-50 rounded-3xl overflow-hidden
            "
          >
            {/* Header & Tabs */}
            <div className="shrink-0 flex flex-col border-b border-white/5 bg-white/[0.02]">
              <div className="drag-handle h-14 px-5 flex items-center justify-between cursor-move active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto absolute left-1/2 -translate-x-1/2" />
                <h3 className="font-semibold text-white tracking-wide text-sm">
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
            People <span className="bg-white/10 text-xs px-1.5 py-0.5 rounded-full">{allParticipants.length}</span>
          </button>
          
          {isHost && (
            <button
              onClick={() => setActiveTab("director")}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "director" ? "border-amber-500 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Director 👑
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === "chat" ? (
          <>
            {/* Chat Input (Fixed at Top) */}
            <div className="shrink-0 p-4 bg-white/[0.01] border-b border-white/5 relative">
              {isUploading && (
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                  <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="flex gap-2 items-end bg-black/40 rounded-[1.25rem] border border-white/10 p-1.5 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FiPaperclip size={16} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }} 
                  className="hidden" 
                />
                <input
                  id="chatMessage"
                  name="chatMessage"
                  value={msg}
                  onChange={(e) => {
                    setMsg(e.target.value);
                    if (setTyping) setTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type or drop a file..."
                  className="
                    flex-1 bg-transparent px-1 py-2 outline-none
                    text-sm text-white placeholder:text-slate-500
                  "
                  autoComplete="off"
                />
                <button
                  onClick={() => sendMessage()}
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

            <div 
              className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 flex flex-col relative"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 z-10 bg-cyan-950/80 backdrop-blur-sm border-2 border-dashed border-cyan-500 rounded-xl flex items-center justify-center m-2">
                  <div className="text-center text-cyan-400">
                    <FiDownload size={32} className="mx-auto mb-2 animate-bounce" />
                    <p className="font-semibold">Drop file to upload</p>
                  </div>
                </div>
              )}
              <div ref={messagesStartRef} />
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 mt-10">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <FiMessageCircle size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-slate-600 text-center px-8">
                    Messages and files here are visible to everyone in the call.
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
                      
                      {m.type === 'file' ? (
                        <div className={`
                          max-w-[85%] p-1 text-sm leading-relaxed
                          ${isMe 
                            ? "bg-cyan-600/20 border border-cyan-500/30 rounded-2xl rounded-tr-sm" 
                            : "bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-sm"
                          }
                        `}>
                           <div className="flex items-center gap-3 p-2">
                             <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-cyan-400 shrink-0">
                               <FiFile size={20} />
                             </div>
                             <div className="min-w-0 flex-1 pr-2">
                               <p className="text-white font-medium truncate text-sm" title={m.fileName}>{m.fileName}</p>
                               <p className="text-slate-400 text-[10px] uppercase">{(m.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                             </div>
                             <a 
                               href={m.fileUrl} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               download={m.fileName}
                               className="h-8 w-8 rounded-lg bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors shrink-0"
                               title="Download File"
                             >
                               <FiDownload size={14} />
                             </a>
                           </div>
                        </div>
                      ) : (
                        <div className={`
                          max-w-[85%] px-4 py-2.5 text-sm leading-relaxed break-words
                          ${isMe 
                            ? "bg-cyan-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-cyan-900/20" 
                            : "bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-sm border border-white/5 shadow-sm"
                          }
                        `}>
                          {m.text}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {typingUsers && typingUsers.length > 0 && (
                <div className="flex flex-col items-start mt-4">
                  <div className="bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1s_infinite]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1s_infinite_200ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1s_infinite_400ms]" />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : activeTab === "people" ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
            {allParticipants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                </div>
                {p.id !== "local" && isHost && (
                  <button 
                    onClick={() => adminActions?.kickParticipant(p.id)}
                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs hover:bg-red-500 hover:text-white transition-colors"
                  >
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === "director" ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
            <div>
              <h4 className="text-amber-500 font-medium text-sm mb-3">Room Theme</h4>
              <div className="grid grid-cols-2 gap-2">
                {['default', 'cyberpunk', 'matrix', 'ocean'].map(t => (
                  <button 
                    key={t}
                    onClick={() => adminActions?.setTheme(t)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize border ${roomState?.theme === t ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-amber-500 font-medium text-sm mb-3">Spotlight Participant</h4>
              <select 
                value={roomState?.spotlightUid || ""}
                onChange={(e) => adminActions?.setSpotlight(e.target.value || null)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white"
              >
                <option value="">None (Normal Grid)</option>
                {allParticipants.map(p => (
                  <option key={p.id} value={p.id === "local" ? "local" : p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <button 
                onClick={() => adminActions?.toggleFocusMode()}
                className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${roomState?.focusMode ? 'bg-red-500 text-white' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
              >
                {roomState?.focusMode ? 'Disable Focus Mode' : 'Enable Focus Mode (Mute All)'}
              </button>
              <p className="text-xs text-slate-400 mt-2 text-center">Focus Mode silences everyone except the Spotlight user.</p>
            </div>
          </div>
        ) : null}
        </div>
      </motion.div>
        </Draggable>
      )}
    </AnimatePresence>
  );
});

export default SidePanel;
