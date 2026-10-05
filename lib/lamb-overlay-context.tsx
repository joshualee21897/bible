import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';

import type { LambMood } from '../components/pixel/lamb-sprites';

export type LambAction = { label: string; onPress: () => void; primary?: boolean };

export type LambConfig = {
  /** Unique per place this message comes from, e.g. "today", "feed-prayers". */
  id: string;
  message: string | string[];
  pose?: LambMood;
  sparkles?: boolean;
  actions?: LambAction[];
};

const DEFAULT_CONFIG: LambConfig = { id: 'idle', message: 'Tap me anytime!', pose: 'happy' };

// Split into two contexts on purpose: screens that only need to *set* the
// message (the vast majority) subscribe to `LambSetContext`, whose value
// (the `setActive` function) never changes identity — so those screens
// never re-render just because the floating lamb's message changed
// elsewhere. Only `FloatingLamb` itself reads `LambActiveContext`.
const LambActiveContext = createContext<LambConfig>(DEFAULT_CONFIG);
const LambSetContext = createContext<(config: LambConfig | null) => void>(() => {});

export function LambOverlayProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState<LambConfig>(DEFAULT_CONFIG);
  const setActive = useRef((config: LambConfig | null) => setActiveState(config ?? DEFAULT_CONFIG)).current;

  return (
    <LambSetContext.Provider value={setActive}>
      <LambActiveContext.Provider value={active}>{children}</LambActiveContext.Provider>
    </LambSetContext.Provider>
  );
}

/** Used only by the floating lamb itself, to read whatever is currently active. */
export function useFloatingLambActive(): LambConfig {
  return useContext(LambActiveContext);
}

/**
 * Registers what the floating lamb should say while the calling screen (or
 * a component nested inside one) is focused. Pass `null` when this screen
 * has nothing to say right now — the lamb falls back to the idle default.
 */
export function useLambMessage(config: LambConfig | null) {
  const setActive = useContext(LambSetContext);
  useFocusEffect(() => {
    setActive(config);
  });
}
