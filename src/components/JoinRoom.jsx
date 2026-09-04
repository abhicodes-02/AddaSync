import { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/room/${id}`, { state: { userName: userName.trim() || "Host" } });
  };

  const joinRoom = () => {
    const trimmed = roomId.trim();

    if (!trimmed) {
      alert("Please enter a Room ID");
      return;
    }

    if (trimmed.length < 4) {
      alert("Room ID must be at least 4 characters");
      return;
    }

    navigate(`/room/${trimmed}`, {
      state: { userName: userName.trim() || "Guest" },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
      {/* Background Blur Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-3xl">
              🎥
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">MeetFlow</h1>

            <p className="text-slate-400">
              Premium Video Conferencing Experience
            </p>
          </div>

          {/* Name Input */}
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your Name (optional)"
            className="
              w-full px-4 py-4 rounded-xl
              bg-white/5 border border-white/10
              text-white placeholder:text-slate-500
              outline-none focus:border-cyan-500
              mb-4 transition
            "
          />

          <button
            onClick={createRoom}
            className="
              w-full py-4 rounded-xl
              bg-gradient-to-r from-emerald-500 to-green-600
              text-white font-semibold
              hover:scale-[1.02] transition-all duration-300
              shadow-lg active:scale-[0.98]
            "
          >
            ✨ Create New Meeting
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-slate-500 text-sm">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter Meeting ID"
            className="
              w-full px-4 py-4 rounded-xl
              bg-white/5 border border-white/10
              text-white placeholder:text-slate-500
              outline-none focus:border-cyan-500
              mb-4 transition
            "
          />

          <button
            onClick={joinRoom}
            className="
              w-full py-4 rounded-xl
              bg-gradient-to-r from-cyan-500 to-blue-600
              text-white font-semibold
              hover:scale-[1.02] transition-all duration-300
              shadow-lg active:scale-[0.98]
            "
          >
            🚀 Join Meeting
          </button>

          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xl">🔒</div>
              <div className="text-xs text-slate-400 mt-1">Secure</div>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xl">⚡</div>
              <div className="text-xs text-slate-400 mt-1">Fast</div>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xl">🌍</div>
              <div className="text-xs text-slate-400 mt-1">Global</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinRoom;