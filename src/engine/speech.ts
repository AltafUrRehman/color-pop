// Spoken words (colour names, "Pakistan! Well done!") through the browser's built-in voices.
// ChromeOS ships offline English voices; where none exist this quietly does nothing.

let enabled = true;
let voice: SpeechSynthesisVoice | null | undefined;

export function setSpeech(on: boolean) {
  enabled = on;
  if (!on) try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

function pickVoice(): SpeechSynthesisVoice | null {
  const vs = window.speechSynthesis.getVoices();
  if (!vs.length) return null;
  return vs.find((v) => v.lang.startsWith('en') && v.localService) ?? vs.find((v) => v.lang.startsWith('en')) ?? null;
}

export function say(text: string) {
  if (!enabled || !text || !('speechSynthesis' in window)) return;
  try {
    const s = window.speechSynthesis;
    if (voice === undefined || voice === null) voice = pickVoice();
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1.15;
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    s.speak(u);
  } catch {
    /* no speech */
  }
}
