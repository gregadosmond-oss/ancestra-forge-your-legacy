// Module-level singleton — survives React navigation (SPA stays mounted)
let audio: HTMLAudioElement | null = null;

export const startAmbientAudio = (): void => {
  if (audio) return;
  audio = new Audio("/starfields-within.mp3");
  audio.loop = true;
  audio.volume = 0.5;
  audio.play().catch(() => {/* autoplay blocked — silent fail */});
};

export const toggleAmbientMute = (): void => {
  if (audio) audio.muted = !audio.muted;
};

export const isAmbientPlaying = (): boolean => !!audio;
