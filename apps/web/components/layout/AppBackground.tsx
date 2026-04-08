export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--bg-app)]" />

      <div className="absolute -left-24 -top-20 h-[420px] w-[420px] rounded-full bg-[var(--glow-primary)] blur-[140px] animate-pulse [animation-duration:6s]" />
      <div className="absolute left-[18%] top-[8%] h-[320px] w-[320px] rounded-full bg-[var(--glow-secondary)] blur-[120px] animate-pulse [animation-duration:7s] [animation-delay:400ms]" />
      <div className="absolute left-[42%] top-[-6%] h-[360px] w-[360px] rounded-full bg-[var(--glow-accent)] blur-[128px] animate-pulse [animation-duration:8s] [animation-delay:1200ms]" />
      <div className="absolute right-[8%] top-[6%] h-[340px] w-[340px] rounded-full bg-[var(--glow-primary)] blur-[132px] animate-pulse [animation-duration:5.5s] [animation-delay:900ms]" />

      <div className="absolute left-[4%] top-[34%] h-[280px] w-[280px] rounded-full bg-[var(--glow-accent)] blur-[110px] animate-pulse [animation-duration:7.5s] [animation-delay:1600ms]" />
      <div className="absolute left-[28%] top-[38%] h-[400px] w-[400px] rounded-full bg-[var(--glow-primary)] blur-[150px] animate-pulse [animation-duration:9s] [animation-delay:700ms]" />
      <div className="absolute left-[58%] top-[32%] h-[300px] w-[300px] rounded-full bg-[var(--glow-secondary)] blur-[118px] animate-pulse [animation-duration:6.8s] [animation-delay:1500ms]" />
      <div className="absolute right-[2%] top-[40%] h-[360px] w-[360px] rounded-full bg-[var(--glow-accent)] blur-[130px] animate-pulse [animation-duration:8.4s] [animation-delay:500ms]" />

      <div className="absolute left-[12%] bottom-[8%] h-[340px] w-[340px] rounded-full bg-[var(--glow-secondary)] blur-[132px] animate-pulse [animation-duration:7.2s] [animation-delay:1300ms]" />
      <div className="absolute left-[40%] bottom-[-6%] h-[440px] w-[440px] rounded-full bg-[var(--glow-primary)] blur-[155px] animate-pulse [animation-duration:10s] [animation-delay:200ms]" />
      <div className="absolute right-[24%] bottom-[6%] h-[320px] w-[320px] rounded-full bg-[var(--glow-accent)] blur-[120px] animate-pulse [animation-duration:6.4s] [animation-delay:1800ms]" />
      <div className="absolute -right-24 bottom-[-8%] h-[420px] w-[420px] rounded-full bg-[var(--glow-primary)] blur-[145px] animate-pulse [animation-duration:8.8s] [animation-delay:1000ms]" />

      <div className="absolute inset-x-0 top-[22%] h-px bg-[linear-gradient(90deg,transparent,rgba(95,191,42,0.14),transparent)] opacity-50" />
      <div className="absolute inset-x-0 bottom-[20%] h-px bg-[linear-gradient(90deg,transparent,rgba(95,191,42,0.1),transparent)] opacity-40" />
    </div>
  );
}

export default AppBackground;
