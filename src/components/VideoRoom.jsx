import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import useWebRTC from "../hooks/useWebRTC";
import useMediaControls from "../hooks/useMediaControls";
import useChat from "../hooks/useChat";
import usePictureInPicture from "../hooks/usePictureInPicture";

import RoomHeader from "./room/RoomHeader";
import VideoGrid from "./room/VideoGrid";
import ChatPanel from "./room/ChatPanel";
import ControlDock from "./room/ControlDock";
import LoadingScreen from "./ui/LoadingScreen";

function VideoRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const userName = location.state?.userName || "Guest";
  const remoteVideoRef = useRef(null);
  const started = useRef(false);

  const [chatOpen, setChatOpen] = useState(window.innerWidth >= 1024);
  const [isReady, setIsReady] = useState(false);

  const {
    localStream,
    remoteStream,
    connectionState,
    error,
    pcRef,
    localStreamRef,
    start,
    cleanup,
  } = useWebRTC(roomId);

  const {
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    shareScreen,
  } = useMediaControls(localStreamRef, pcRef);

  const { messages, msg, setMsg, sendMessage, messagesEndRef } = useChat(
    roomId,
    userName
  );

  const { togglePiP } = usePictureInPicture(remoteVideoRef);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      start().then(() => setIsReady(true));
    }
  }, [start]);

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
      
      {/* Floating Presentation Banner */}
      {isScreenSharing && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-50 px-5 py-2 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-[slideIn_0.2s_ease-out]">
          You are presenting to everyone
        </div>
      )}

      {/* Main Spatial Layout */}
      <RoomHeader
        roomId={roomId}
        connectionState={connectionState}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
      />

      <div className="flex-1 w-full h-full relative">
        <VideoGrid
          localStream={localStream}
          remoteStream={remoteStream}
          connectionState={connectionState}
          roomId={roomId}
          remoteVideoRef={remoteVideoRef}
        />
      </div>

      <ChatPanel
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        messages={messages}
        msg={msg}
        setMsg={setMsg}
        sendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
        userName={userName}
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