export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--bg-app)]" />
      <div className="absolute inset-x-0 top-0 h-[38vh] bg-[linear-gradient(180deg,rgba(41,89,63,0.46),rgba(23,31,28,0.28)_46%,transparent)]" />
      <div className="absolute left-[8%] top-[2%] h-[360px] w-[360px] rounded-full bg-[var(--glow-primary)] blur-[150px] animate-pulse [animation-duration:8s]" />
      <div className="absolute left-[40%] top-[-6%] h-[420px] w-[420px] rounded-full bg-[var(--glow-secondary)] blur-[170px] animate-pulse [animation-duration:11s] [animation-delay:900ms]" />
      <div className="absolute right-[10%] top-[4%] h-[320px] w-[320px] rounded-full bg-[var(--glow-accent)] blur-[140px] animate-pulse [animation-duration:10s] [animation-delay:1600ms]" />
      <div className="absolute left-[24%] top-[34%] h-[300px] w-[300px] rounded-full bg-[rgba(255,255,255,0.02)] blur-[150px]" />
      <div className="absolute right-[18%] bottom-[12%] h-[260px] w-[260px] rounded-full bg-[rgba(255,255,255,0.015)] blur-[140px]" />
    </div>
  );
}

export default AppBackground;
