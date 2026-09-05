import { FiArrowRight } from "react-icons/fi";

export default function JoinPrompt({ nameInput, setNameInput, handleJoin }) {
  return (
    <div className="h-[100dvh] bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
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
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="e.g. John Doe"
            className="w-full bg-black/40 text-white placeholder-slate-500 px-5 py-4 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300"
            autoFocus
          />
        </div>
        <button
          onClick={handleJoin}
          disabled={!nameInput.trim()}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-4 px-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group active:scale-[0.98]"
        >
          Join Room
          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

