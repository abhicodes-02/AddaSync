import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import useWebRTC from "../hooks/useWebRTC";
import useMediaControls from "../hooks/useMediaControls";
import useChat from "../hooks/useChat";
import usePictureInPicture from "../hooks/usePictureInPicture";

import RoomHeader from "./room/RoomHeader";
import VideoGrid from "./room/VideoGrid";
import SidePanel from "./room/SidePanel";
import ControlDock from "./room/ControlDock";
import LoadingScreen from "./ui/LoadingScreen";
import JoinPrompt from "./room/JoinPrompt";
import ErrorScreen from "./room/ErrorScreen";
import KnockingScreen from "./room/KnockingScreen";

const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(1.5, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    // Classic Doorbell Ding-Dong (E5 -> C5)
    playNote(659.25, ctx.currentTime, 0.5);
    playNote(523.25, ctx.currentTime + 0.4, 0.8);
  } catch (e) {
    console.warn("Audio chime failed", e);
  }
};

export default function VideoRoom() {
  const { roomId: rawRoomId } = useParams();
  const roomId = rawRoomId ? rawRoomId.toUpperCase() : "";
  const navigate = useNavigate();
  const location = useLocation();

  const [localName, setLocalName] = useState(() => {
    try {
      const navigated = sessionStorage.getItem("meetflow_navigated");
      if (navigated) {
        sessionStorage.removeItem("meetflow_navigated");
        return location.state?.userName || "";
      }
    } catch (e) {}
    return "";
  });
  const [nameInput, setNameInput] = useState(() => {
    try {
      return localStorage.getItem("meetflow_name") || "";
    } catch (e) {
      return "";
    }
  });
  
  const localVideoRef = useRef(null);
  const started = useRef(false);

  // 'chat', 'people', or null
  const [activeTab, setActiveTab] = useState(window.innerWidth >= 1024 ? "chat" : null);
  const [isReady, setIsReady] = useState(false);

  // 1. ALL HOOKS FIRST (Prevents ReferenceError TDZ bugs)
  const {
    localStream,
    setLocalStream,
    remoteStreams,
    participantNames,
    participantStates,
    connectionState,
    error,
    peersRef,
    localStreamRef,
    isHost,
    pendingKnockers,
    resolveKnock,
    start,
    cleanup,
    switchCamera,
  } = useWebRTC(roomId, localName);

  const {
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    shareScreen,
    stopSharing,
    startExternalStream,
  } = useMediaControls(localStreamRef, peersRef, setLocalStream);

  const { messages, msg, setMsg, sendMessage, messagesEndRef } = useChat(
    roomId,
    localName
  );

  const { togglePiP, PiPPortal } = usePictureInPicture(localVideoRef, remoteStreams, localStream);

  // 2. CALLBACKS
  const handleJoin = useCallback(() => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      try {
        localStorage.setItem("meetflow_name", trimmed);
      } catch (e) {
        // Ignore iOS Private Mode errors
      }
      setLocalName(trimmed);
      if (!started.current) {
        started.current = true;
        start(trimmed).then(() => setIsReady(true)).catch(() => setIsReady(true));
      }
    }
  }, [nameInput, start]);

  const [mediaFileUrl, setMediaFileUrl] = useState(null);

  const handleShareMedia = useCallback((file) => {
     if (isScreenSharing) stopSharing();
     const url = URL.createObjectURL(file);
     setMediaFileUrl(url);
  }, [isScreenSharing, stopSharing]);

  const handleStopMedia = useCallback(() => {
     if (mediaFileUrl) {
         URL.revokeObjectURL(mediaFileUrl);
         setMediaFileUrl(null);
     }
     stopSharing();
  }, [mediaFileUrl, stopSharing]);

  const leaveRoom = useCallback(() => {
    if (mediaFileUrl) URL.revokeObjectURL(mediaFileUrl);
    cleanup(); // Fire and forget
    navigate("/", { replace: true });
  }, [cleanup, navigate, mediaFileUrl]);


  // 3. EFFECTS
  const prevKnockersRef = useRef(0);
  useEffect(() => {
    if (isHost && pendingKnockers.length > prevKnockersRef.current) {
      playChime();
    }
    prevKnockersRef.current = pendingKnockers.length;
  }, [isHost, pendingKnockers.length]);

  useEffect(() => {
    // Check if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Auto-start only for non-iOS devices if they came via internal navigation
    if (localName && location.state?.userName && !started.current && !isIOS) {
      started.current = true;
      start(localName).then(() => setIsReady(true)).catch(() => setIsReady(true));
    }
  }, [localName, location.state, start]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.key.toLowerCase()) {
        case "m":
          toggleMute();
          break;
        case "v":
          toggleCamera();
          break;
        case "escape":
          leaveRoom();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMute, toggleCamera, leaveRoom]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      cleanup();
    };
  }, [cleanup, localStreamRef]);

  // 4. RENDERS
  if (!localName) {
    return <JoinPrompt nameInput={nameInput} setNameInput={setNameInput} handleJoin={handleJoin} />;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!started.current && !isReady && isIOS) {
    // iOS ONLY: User came from home page with a name, but hasn't tapped Join yet (needed for iOS gesture)
    return (
      <div className="h-[100dvh] bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        </div>
        <div className="relative z-10 w-full max-w-sm backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-[2rem] shadow-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-0.5 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
            <img src="/logo.jpg" alt="AddaSync Logo" className="w-full h-full object-cover rounded-[1rem]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ready to join? (iOS)</h2>
          <p className="text-slate-400 text-sm mb-2">Joining as <span className="text-cyan-400 font-medium">{localName}</span></p>
          <p className="text-slate-500 text-xs mb-8">Room: <span className="font-mono text-slate-300">{roomId}</span></p>
          <button
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 active:scale-[0.97] text-lg"
          >
            🎥 Tap to Join
          </button>
          <p className="text-slate-600 text-[11px] mt-4">Required for Apple devices to activate camera</p>
        </div>
      </div>
    );
  }

  if (connectionState === "knocking") {
    return <KnockingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} leaveRoom={leaveRoom} />;
  }

  if (!isReady) {
    return <LoadingScreen message="Connecting to secure mesh..." />;
  }

  return (
    <div className="h-[100dvh] w-screen bg-[#0a0a0a] text-white flex overflow-hidden relative font-sans">
      
      {/* Host Knocking Notifications */}
      {isHost && pendingKnockers.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
          {pendingKnockers.map(knocker => (
            <div key={knocker.uid} className="bg-black/80 backdrop-blur-xl border border-amber-500/30 shadow-2xl p-4 rounded-2xl flex items-center justify-between pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-medium">
                  {knocker.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{knocker.userName}</p>
                  <p className="text-xs text-amber-500/80">Wants to join</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => resolveKnock(knocker.uid, "denied")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10 transition-colors"
                >
                  Deny
                </button>
                <button 
                  onClick={() => resolveKnock(knocker.uid, "admitted")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                >
                  Admit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {PiPPortal}

      <RoomHeader 
        roomId={roomId}
        connectionState={connectionState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        participantsCount={remoteStreams.size + 1}
      />

      <SidePanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        messages={messages}
        msg={msg}
        setMsg={setMsg}
        sendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
        participantNames={participantNames}
        userName={localName}
      />

      <div className="flex-1 relative flex flex-col min-w-0 transition-all duration-300">
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          participantNames={participantNames}
          participantStates={participantStates}
          localName={localName}
          localIsMuted={isMuted}
          localIsCameraOff={isCameraOff}
          connectionState={connectionState}
          roomId={roomId}
          localVideoRef={localVideoRef}
          isScreenSharing={isScreenSharing}
          mediaFileUrl={mediaFileUrl}
          startExternalStream={startExternalStream}
        />

        <ControlDock
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          toggleMute={toggleMute}
          toggleCamera={toggleCamera}
          switchCamera={switchCamera}
          shareScreen={shareScreen}
          onLeave={leaveRoom}
          togglePiP={togglePiP}
          mediaFileUrl={mediaFileUrl}
          onShareMedia={handleShareMedia}
          onStopMedia={handleStopMedia}
        />
      </div>
    </div>
  );
}