import { useRef, memo } from "react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMonitor,
  FiFilm,
  FiPhoneOff,
  FiMinimize2,
  FiRefreshCcw,
} from "react-icons/fi";

function DockButton({ onClick, active, danger, accent, tooltip, children }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          h-10 w-10 sm:h-12 sm:w-12
          rounded-2xl
          flex items-center justify-center
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl
          active:scale-95 active:translate-y-0
          ${danger
            ? "bg-red-500 hover:bg-red-400 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]"
            : active
              ? "bg-red-500 hover:bg-red-400 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]"
              : accent
                ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_4px_14px_0_rgba(6,182,212,0.39)]"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/5 backdrop-blur-md"
          }
        `}
      >
        {children}
      </button>
      {tooltip && (
        <div className="
          absolute -top-12 left-1/2 -translate-x-1/2
          backdrop-blur-xl bg-slate-800/90 text-[11px] text-white font-medium
          px-3 py-1.5 rounded-lg border border-white/10
          opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100
          transition-all duration-200 pointer-events-none shadow-xl
          hidden sm:block whitespace-nowrap
        ">
          {tooltip}
        </div>
      )}
    </div>
  );
}

const ControlDock = memo(function ControlDock({
  isMuted,
  isCameraOff,
  isScreenSharing,
  toggleMute,
  toggleCamera,
  switchCamera,
  shareScreen,
  onShareMedia,
  onStopMedia,
  togglePiP,
  onLeave,
  mediaFileUrl,
  sendReaction,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onShareMedia) {
      onShareMedia(file);
    }
    e.target.value = null;
  };

  return (
    <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-40">
      <div className="
        backdrop-blur-2xl bg-slate-900/60
        border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
        rounded-[2rem] p-2 sm:p-2.5
        flex items-center gap-1 sm:gap-2.5
      ">
        <DockButton onClick={toggleMute} active={isMuted} tooltip={isMuted ? "Unmute (M)" : "Mute (M)"}>
          {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
        </DockButton>

        <DockButton onClick={toggleCamera} active={isCameraOff} tooltip={isCameraOff ? "Camera On (V)" : "Camera Off (V)"}>
          {isCameraOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
        </DockButton>

        {!isCameraOff && (
          <div className="sm:hidden">
            <DockButton onClick={switchCamera} tooltip="Flip Camera">
              <FiRefreshCcw size={18} />
            </DockButton>
          </div>
        )}

        <div className="w-px h-8 bg-white/10 mx-0.5" />

        <DockButton onClick={shareScreen} accent={isScreenSharing} tooltip={isScreenSharing ? "Stop Sharing" : "Present Screen"}>
          <FiMonitor size={18} />
        </DockButton>
        
        <input 
           type="file" 
           ref={fileInputRef} 
           accept="video/*,audio/*" 
           onChange={handleFileChange} 
           className="hidden" 
        />
        {mediaFileUrl ? (
          <DockButton onClick={onStopMedia} active tooltip="Stop Media">
            <FiFilm size={18} />
          </DockButton>
        ) : (
          <DockButton onClick={() => fileInputRef.current?.click()} tooltip="Share Media File">
            <FiFilm size={18} />
          </DockButton>
        )}

        <div className="hidden sm:block">
          <DockButton onClick={togglePiP} tooltip="Picture in Picture">
            <FiMinimize2 size={18} />
          </DockButton>
        </div>

        <div className="w-px h-8 bg-white/10 mx-0.5" />

        <div className="relative group/emoji flex items-center justify-center">
          <DockButton onClick={() => {}} tooltip="React">
            <span className="text-lg leading-none emoji-reaction">🔥</span>
          </DockButton>
          
          <div className="absolute bottom-full mb-2 opacity-0 group-hover/emoji:opacity-100 pointer-events-none group-hover/emoji:pointer-events-auto transition-opacity duration-200">
            <div className="bg-slate-800 border border-white/10 shadow-2xl rounded-2xl p-2 flex gap-2">
               {['👍', '❤️', '😂', '🎉', '🔥', '👏'].map(emoji => (
                 <button 
                   key={emoji}
                   onClick={() => sendReaction?.(emoji)}
                   className="w-10 h-10 hover:bg-white/10 rounded-xl text-xl transition-transform hover:scale-125 active:scale-95 flex items-center justify-center emoji-reaction"
                 >
                   {emoji}
                 </button>
               ))}
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10 mx-0.5" />

        <DockButton onClick={onLeave} danger tooltip="Leave Call">
          <FiPhoneOff size={18} />
        </DockButton>
      </div>
    </div>
  );
});

export default ControlDock;
