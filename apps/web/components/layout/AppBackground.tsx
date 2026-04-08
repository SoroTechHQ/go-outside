export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      <div className="glow-orb absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-[rgba(95,191,42,0.08)] blur-[160px]" />
      <div className="glow-orb-delayed absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[rgba(58,140,48,0.06)] blur-[140px]" />
      <div className="glow-orb absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-[rgba(95,191,42,0.04)] blur-[100px] [animation-duration:5s] [animation-delay:1s]" />
      <div className="glow-orb-delayed absolute bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-[rgba(42,102,36,0.05)] blur-[120px] [animation-duration:9s] [animation-delay:3s]" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

export default AppBackground;
