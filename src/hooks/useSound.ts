import { useCallback, useRef } from "react";

type SoundType = "select" | "play" | "pass" | "win" | "turn";

export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine") => {
      if (!enabled) return;
      try {
        const ctx = getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Web Audio not available
      }
    },
    [enabled, getContext]
  );

  const play = useCallback(
    (type: SoundType) => {
      switch (type) {
        case "select":
          playTone(440, 0.08, "sine");
          break;
        case "play":
          playTone(523, 0.12, "triangle");
          setTimeout(() => playTone(659, 0.1, "triangle"), 80);
          break;
        case "pass":
          playTone(220, 0.15, "sawtooth");
          break;
        case "turn":
          playTone(587.33, 0.08, "sine");
          setTimeout(() => playTone(880, 0.12, "sine"), 80);
          break;
        case "win":
          playTone(523, 0.15, "sine");
          setTimeout(() => playTone(659, 0.15, "sine"), 150);
          setTimeout(() => playTone(784, 0.2, "sine"), 300);
          break;
      }
    },
    [playTone]
  );

  return { play };
}
