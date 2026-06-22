// ============================================================
//  効果音（Web Audio API で合成。音声ファイル不要）
//  ミュートは localStorage に保存。最初のユーザー操作で解錠される。
// ============================================================
let actx: AudioContext | null = null;
let muted = localStorage.getItem("mhoreka-mute") === "1";

function ac(): AudioContext | null {
  if (muted) return null;
  if (!actx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      actx = new Ctor();
    } catch {
      return null;
    }
  }
  if (actx.state === "suspended") void actx.resume();
  return actx;
}

export function isMuted(): boolean {
  return muted;
}
export function toggleMute(): boolean {
  muted = !muted;
  localStorage.setItem("mhoreka-mute", muted ? "1" : "0");
  return muted;
}

// 単音（任意で周波数スライド）
function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.18,
  slideTo?: number,
): void {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

// ノイズ（打撃感）
function noise(dur: number, vol = 0.2, filterFreq = 1400): void {
  const a = ac();
  if (!a) return;
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filt = a.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = filterFreq;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(a.destination);
  src.start();
  src.stop(a.currentTime + dur);
}

export const sfx = {
  attack(): void { noise(0.1, 0.16, 2000); tone(200, 0.08, "square", 0.05); },
  crit(): void { noise(0.18, 0.26, 3000); tone(440, 0.2, "sawtooth", 0.12, 880); },
  hurt(): void { noise(0.12, 0.18, 700); tone(170, 0.25, "sawtooth", 0.16, 60); },
  dodge(): void { tone(520, 0.12, "sine", 0.1, 1100); },
  just(): void { tone(880, 0.1, "triangle", 0.14, 1760); tone(1320, 0.2, "sine", 0.08); },
  telegraph(): void { tone(130, 0.18, "square", 0.1); },
  weak(): void { tone(1040, 0.08, "sine", 0.08, 1560); },
  victory(): void { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.2, "triangle", 0.13), i * 95)); },
  down(): void { tone(300, 0.5, "sawtooth", 0.16, 70); },
  ui(): void { tone(640, 0.05, "sine", 0.06); },
};
