export default function LoadingScreen({ message = "Setting up your meeting..." }) {
  return (
    <div className="h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Dynamic background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmin] h-[60vmin] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse-slow" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-8">
          {/* Animated rings */}
          <div className="absolute inset-0 border-[3px] border-cyan-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-2 border-[3px] border-t-cyan-400 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-[spin_1.5s_ease-in-out_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full backdrop-blur-sm">
            <span className="text-4xl drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">🎥</span>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">
          AddaSync
        </h2>

        <p className="text-slate-400 font-medium tracking-wide text-sm mb-8 animate-pulse">
          {message}
        </p>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-400"
              style={{
                animation: `bounce 1s ease-in-out infinite`,
                animationDelay: `${i * 150}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
