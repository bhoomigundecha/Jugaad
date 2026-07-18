/**
 * AmbientOrbs — decorative background blurred colour orbs.
 * Purely visual; uses CSS variable colours so they adapt to dark/light theme.
 */
export default function AmbientOrbs() {
  return (
    <>
      <div
        className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full pointer-events-none z-0 transition-all duration-700"
        style={{ background: 'var(--orb-1)', filter: 'blur(110px)' }}
      />
      <div
        className="absolute top-[180px] right-[-110px] w-[280px] h-[280px] rounded-full pointer-events-none z-0 transition-all duration-700"
        style={{ background: 'var(--orb-2)', filter: 'blur(100px)' }}
      />
      <div
        className="absolute bottom-[100px] left-[10px] w-[220px] h-[220px] rounded-full pointer-events-none z-0 transition-all duration-700"
        style={{ background: 'var(--orb-3)', filter: 'blur(90px)' }}
      />
    </>
  );
}
