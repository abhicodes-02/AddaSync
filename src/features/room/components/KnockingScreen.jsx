export default function KnockingScreen() {
  return (
    <div className="h-[100dvh] bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] mix-blend-screen animate-[pulse_4s_ease-in-out_infinite]" />
      </div>
      <div className="text-center relative z-10 max-w-md backdrop-blur-xl bg-white/[0.02] border border-white/10 p-10 rounded-[2rem] shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          🔔
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Knocking...</h2>
        <p className="text-slate-400">Waiting for the host to let you in.</p>
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

