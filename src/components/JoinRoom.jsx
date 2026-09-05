import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiVideo, FiArrowRight } from "react-icons/fi";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    const trimmed = roomId.trim().toUpperCase();
    if (trimmed.length < 4) {
      alert("Room ID must be at least 4 characters");
      return;
    }
    try { sessionStorage.setItem("meetflow_navigated", "true"); } catch (e) {}
    navigate(`/room/${trimmed}`, {
      state: { userName: userName.trim() },
    });
  };

  const generateRoom = () => {
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newId);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4 font-sans text-white">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-[2rem] shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-0.5 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden">
              <img src="/logo.jpg" alt="AddaSync Logo" className="w-full h-full object-cover rounded-[1.8rem]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              AddaSync
            </h1>
            <p className="text-slate-400 text-sm">
              Premium video calling for everyone.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                Room Code
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                placeholder="Enter 6-letter code"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all uppercase tracking-wide"
              />
            </div>

            <button
              onClick={joinRoom}
              disabled={!userName.trim()}
              className="w-full group relative flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl px-4 py-3.5 hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              Join Meeting
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Don't have a room code?{" "}
              <button
                onClick={generateRoom}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Start a new meeting
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}