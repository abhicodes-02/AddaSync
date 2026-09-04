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
import { FiArrowRight } from "react-icons/fi";

function VideoRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [localName, setLocalName] = useState(location.state?.userName || "");
  const [nameInput, setNameInput] = useState("");
  
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const started = useRef(false);

  // 'chat', 'people', or null
  const [activeTab, setActiveTab] = useState(window.innerWidth >= 1024 ? "chat" : null);
  const [isReady, setIsReady] = useState(false);

  const {
    localStream,
    remoteStreams,
    participantNames,
    connectionState,
    error,
    peersRef,
    localStreamRef,
    start,
    cleanup,
  } = useWebRTC(roomId, localName);

  const {
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    shareScreen,
  } = useMediaControls(localStreamRef, peersRef);

  const { messages, msg, setMsg, sendMessage, messagesEndRef } = useChat(
    roomId,
    localName
  );

  const { togglePiP } = usePictureInPicture(localVideoRef, remoteStreams);

  useEffect(() => {
    if (localName && !started.current) {
      started.current = true;
      start().then(() => setIsReady(true));
    }
  }, [localName, start]);

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
  }, [toggleMute, toggleCamera]);

  const leaveRoom = useCallback(async () => {
    await cleanup();
    navigate("/");
  }, [cleanup, navigate]);

  if (!localName) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        </div>
        <div className="relative z-10 w-full max-w-sm backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-[2rem] shadow-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-0.5 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <img src="/logo.jpg" alt="MeetFlow" className="w-full h-full object-cover rounded-[1rem]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">What's your name?</h2>
          <p className="text-slate-400 text-sm mb-6 text-center">Enter your name to join the room.</p>
          <div className="relative group mb-6">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && nameInput.trim() && setLocalName(nameInput.trim())}
              placeholder="Your Name"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
              autoFocus
            />
          </div>
          <button
            onClick={() => nameInput.trim() && setLocalName(nameInput.trim())}
            disabled={!nameInput.trim()}
            className="w-full relative group overflow-hidden rounded-xl bg-white text-black font-semibold px-4 py-3.5 transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            Join Room
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-md backdrop-blur-xl bg-white/[0.02] border border-white/10 p-10 rounded-[2rem] shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            Unable to Connect
          </h2>
          <p className="text-slate-400 mb-8">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full px-6 py-3.5 rounded-xl bg-white text-black font-semibold hover:bg-slate-100 transition-all active:scale-95"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return <LoadingScreen message="Starting camera & microphone..." />;
  }

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex overflow-hidden relative font-sans">
      
      {isScreenSharing && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-50 px-5 py-2 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-[slideIn_0.2s_ease-out]">
          You are presenting to everyone
        </div>
      )}

      <RoomHeader
        roomId={roomId}
        connectionState={connectionState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        participantsCount={remoteStreams.size + 1}
      />

      <div className="flex-1 w-full h-full relative">
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          participantNames={participantNames}
          localName={localName}
          connectionState={connectionState}
          roomId={roomId}
          localVideoRef={localVideoRef}
        />
      </div>

      <SidePanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        messages={messages}
        msg={msg}
        setMsg={setMsg}
        sendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
        userName={localName}
        participantNames={participantNames}
      />

      <ControlDock
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        toggleMute={toggleMute}
        toggleCamera={toggleCamera}
        shareScreen={shareScreen}
        togglePiP={togglePiP}
        onLeave={leaveRoom}
      />
    </div>
  );
}

export default VideoRoom;