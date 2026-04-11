export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--bg-app)]" />
      <div className="absolute inset-x-0 top-0 h-[34vh] bg-[linear-gradient(180deg,rgba(var(--brand-rgb),0.12),transparent_72%)]" />
      <div className="absolute left-[6%] top-[3%] h-[320px] w-[320px] rounded-full bg-[color:rgba(var(--brand-rgb),0.1)] blur-[140px]" />
      <div className="absolute left-[40%] top-[-8%] h-[400px] w-[400px] rounded-full bg-[color:rgba(var(--brand-rgb),0.06)] blur-[170px]" />
      <div className="absolute right-[10%] top-[4%] h-[280px] w-[280px] rounded-full bg-[color:rgba(var(--brand-rgb),0.05)] blur-[140px]" />
      <div className="absolute left-[24%] top-[34%] h-[260px] w-[260px] rounded-full bg-[color:rgba(var(--brand-rgb),0.035)] blur-[140px]" />
      <div className="absolute right-[18%] bottom-[12%] h-[240px] w-[240px] rounded-full bg-[color:rgba(var(--brand-rgb),0.03)] blur-[130px]" />
    </div>
  );
}

export default AppBackground;
