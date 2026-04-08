export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[rgba(95,191,42,0.12)] blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[rgba(58,140,48,0.1)] blur-[128px] animate-pulse [animation-delay:700ms]" />
      <div className="absolute right-1/3 top-1/4 h-64 w-64 rounded-full bg-[rgba(95,191,42,0.08)] blur-[96px] animate-pulse [animation-delay:1000ms]" />
    </div>
  );
}

export default AppBackground;
