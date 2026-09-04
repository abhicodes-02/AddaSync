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

  // Start WebRTC on mount
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      start().then(() => setIsReady(true));
    }
  }, [start]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

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

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-600/20 flex items-center justify-center text-4xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Unable to Start Call
          </h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isReady) {
    return <LoadingScreen message="Requesting camera & microphone access..." />;
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <RoomHeader
        roomId={roomId}
        connectionState={connectionState}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        onLeave={leaveRoom}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Presentation Banner */}
        {isScreenSharing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-cyan-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg animate-[slideIn_0.2s_ease-out]">
            You are presenting to everyone
          </div>
        )}

        <VideoGrid
          localStream={localStream}
          remoteStream={remoteStream}
          connectionState={connectionState}
          roomId={roomId}
          remoteVideoRef={remoteVideoRef}
        />

        <ChatPanel
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          messages={messages}
          msg={msg}
          setMsg={setMsg}
          sendMessage={sendMessage}
          messagesEndRef={messagesEndRef}
        />
      </div>

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