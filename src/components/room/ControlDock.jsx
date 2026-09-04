import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMonitor,
  FiPhoneOff,
  FiMinimize2,
} from "react-icons/fi";

function DockButton({ onClick, active, danger, accent, tooltip, children }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          h-10 w-10 sm:h-12 sm:w-12
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          active:scale-90
          ${danger
            ? "bg-red-500 hover:bg-red-400 text-white"
            : active
              ? "bg-red-500/90 hover:bg-red-400 text-white"
              : accent
                ? "bg-cyan-600/90 hover:bg-cyan-500 text-white"
                : "bg-slate-700/80 hover:bg-slate-600 text-slate-200"
          }
        `}
      >
        {children}
      </button>
      {tooltip && (
        <div className="
          absolute -top-9 left-1/2 -translate-x-1/2
          bg-slate-800 text-[11px] text-white
          px-2 py-1 rounded-md
          opacity-0 group-hover:opacity-100
          transition pointer-events-none
          whitespace-nowrap shadow-lg
          hidden sm:block
        ">
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default function ControlDock({
  isMuted,
  isCameraOff,
  isScreenSharing,
  toggleMute,
  toggleCamera,
  shareScreen,
  togglePiP,
  onLeave,
}) {
  return (
    <div className="
      shrink-0 h-14 sm:h-16
      bg-slate-900/80 backdrop-blur-md
      flex items-center justify-center
      px-3 gap-2 sm:gap-3
    ">
      <DockButton
        onClick={toggleMute}
        active={isMuted}
        tooltip={isMuted ? "Unmute (M)" : "Mute (M)"}
      >
        {isMuted ? <FiMicOff size={17} /> : <FiMic size={17} />}
      </DockButton>

      <DockButton
        onClick={toggleCamera}
        active={isCameraOff}
        tooltip={isCameraOff ? "Camera On (V)" : "Camera Off (V)"}
      >
        {isCameraOff ? <FiVideoOff size={17} /> : <FiVideo size={17} />}
      </DockButton>

      <DockButton
        onClick={shareScreen}
        accent={isScreenSharing}
        tooltip={isScreenSharing ? "Stop Sharing" : "Present Screen"}
      >
        <FiMonitor size={17} />
      </DockButton>

      {/* PiP — hide on very small screens */}
      <div className="hidden sm:block">
        <DockButton onClick={togglePiP} tooltip="Picture in Picture">
          <FiMinimize2 size={16} />
        </DockButton>
      </div>

      <div className="h-5 w-px bg-white/10 mx-0.5 sm:mx-1" />

      <DockButton onClick={onLeave} danger tooltip="Leave Call">
        <FiPhoneOff size={17} />
      </DockButton>
    </div>
  );
}
