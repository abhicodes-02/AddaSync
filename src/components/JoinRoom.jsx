import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiVideo } from "react-icons/fi";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem("addasync_name") || "");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const joinRoom = () => {
    const trimmedId = roomId.trim().toUpperCase();
    const trimmedName = userName.trim();

    if (trimmedId.length < 4) {
      alert("Room ID must be at least 4 characters");
      return;
    }
    
    setIsJoining(true);
    
    try { 
      sessionStorage.setItem("addasync_navigated", "true");
      localStorage.setItem("addasync_name", trimmedName);
    } catch (e) {
      // Ignore Safari private mode errors
    }
    
    // Simulate slight network delay for better UX feel
    setTimeout(() => {
      navigate(`/room/${trimmedId}`, {
        state: { userName: trimmedName },
      });
    }, 400);
  };

  const generateRoom = () => {
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newId);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4 font-sans text-white selection:bg-cyan-500/30">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
        <div className="backdrop-blur-3xl bg-white/[0.02] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all hover:bg-white/[0.03] hover:border-white/20 hover:shadow-[0_0_80px_rgba(6,182,212,0.1)]">
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 p-0.5 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-hidden transition-transform hover:scale-105 duration-300">
              <img src="/logo.jpg" alt="AddaSync Logo" className="w-full h-full object-cover rounded-[1.8rem]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
              AddaSync
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Premium peer-to-peer video calls.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="userName" className="block text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">
                Display Name
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 shadow-inner"
                autoComplete="name"
                aria-label="Display Name"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="roomId" className="block text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">
                Meeting Code
              </label>
              <div className="relative group">
                <input
                  id="roomId"
                  name="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && userName.trim() && joinRoom()}
                  placeholder="Enter 6-letter code"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 uppercase tracking-widest shadow-inner"
                  aria-label="Room Code"
                />
                <button 
                  onClick={generateRoom}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                  title="Generate random code"
                  type="button"
                >
                  <FiVideo size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={joinRoom}
              disabled={!userName.trim() || isJoining}
              className={`
                w-full relative flex items-center justify-center gap-2 
                font-bold text-sm uppercase tracking-wide rounded-2xl px-4 py-4 
                transition-all duration-300 overflow-hidden group
                ${!userName.trim() || isJoining 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5" 
                  : "bg-white text-black hover:bg-slate-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                }
              `}
            >
              <div className="flex items-center gap-2 z-10">
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Join Meeting
                    <FiArrowRight className="group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </div>
              {/* Button Hover Glow Effect */}
              {userName.trim() && !isJoining && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}