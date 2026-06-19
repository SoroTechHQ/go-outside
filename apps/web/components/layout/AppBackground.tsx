export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--bg-app)]" />
    </div>
  );
}

export default AppBackground;
