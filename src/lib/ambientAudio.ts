// Module-level singleton — survives React navigation (SPA stays mounted)
let audio: HTMLAudioElement | null = null;

export const startAmbientAudio = (): void => {
  if (audio) return;
  audio = new Audio("/starfields-within.mp3");
  audio.loop = true;
  audio.volume = 0.5;
  audio.play().catch(() => {/* autoplay blocked — silent fail */});
};

export const toggleAmbientPlayback = (): boolean => {
  if (!audio) {
    // First click — start audio and return playing state
    audio = new Audio("/starfields-within.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    return true; // now playing
  }
  if (audio.paused) {
    audio.play().catch(() => {});
    return true; // now playing
  } else {
    audio.pause();
    return false; // now paused
  }
};

export const isAmbientStarted = (): boolean => !!audio;

export const pauseAmbient = (): void => { audio?.pause(); };
export const resumeAmbient = (): void => { if (audio && audio.paused) audio.play().catch(() => {}); };
