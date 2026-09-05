export default function ErrorScreen({ error, leaveRoom }) {
  return (
    <div className="h-[100dvh] bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>
      <div className="text-center max-w-md backdrop-blur-xl bg-white/[0.02] border border-white/10 p-10 rounded-[2rem] shadow-2xl relative z-10">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connection Error</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
          onClick={leaveRoom}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 backdrop-blur-md border border-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-[0.98]"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

