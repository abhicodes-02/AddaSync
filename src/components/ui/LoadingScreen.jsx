export default function LoadingScreen({ message = "Setting up your meeting..." }) {
  return (
    <div className="h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🎥
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">AddaSync</h2>

        <p className="text-slate-400 mb-6">{message}</p>

        <div className="flex justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
