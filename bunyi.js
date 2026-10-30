/* bunyi.js — kesan bunyi disintesis (tiada fail audio perlu dimuat turun). */
let ctx = null;
export function hidupkanBunyi() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
}
function nada(frek, mula, tempoh, jenis = 'sine', kuat = 0.25) {
  if (!ctx) return;
  const t = ctx.currentTime + mula;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = jenis; o.frequency.setValueAtTime(frek, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(kuat, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + tempoh);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + tempoh + 0.05);
}
function bising(mula, tempoh, kuat = 0.18) {
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * tempoh);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6;
  g.gain.value = kuat;
  s.buffer = buf; s.connect(f).connect(g).connect(ctx.destination);
  s.start(ctx.currentTime + mula);
}
export const Bunyi = {
  detik: () => nada(660, 0, 0.18, 'square', 0.12),
  pistol: () => { nada(1320, 0, 0.5, 'square', 0.14); bising(0, 0.25, 0.3); },
  debar: () => { nada(70, 0, 0.12, 'sine', 0.5); nada(70, 0.18, 0.12, 'sine', 0.4); },
  menang: () => {
    [523, 659, 784, 1047].forEach((f, i) => nada(f, i * 0.12, 0.35, 'triangle', 0.2));
    nada(1047, 0.5, 0.9, 'triangle', 0.18);
    bising(0.1, 2.2, 0.22);
  },
  kalah: () => { nada(392, 0, 0.2, 'triangle', 0.15); nada(330, 0.18, 0.35, 'triangle', 0.13); }
};
