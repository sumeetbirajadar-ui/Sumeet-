/** Generates a "beep beep beep" tone with the Web Audio API — no audio file
 * needed, so it works fully offline. Also vibrates on devices that support it. */
export function playCompletionBeep(times = 3): void {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    let t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
      t += 0.4;
    }
    setTimeout(() => ctx.close(), (times * 400) + 200);
  } catch {
    // Web Audio unavailable — silently skip, vibration below still fires.
  }
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
}
