import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ArtStyle = 'pixel' | 'crayon';

const STORAGE_KEY = 'sprout:artStyle';

function readStoredStyle(): ArtStyle {
  if (typeof window === 'undefined' || !window.localStorage) return 'pixel';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'crayon' ? 'crayon' : 'pixel';
  } catch {
    return 'pixel';
  }
}

function writeStoredStyle(style: ArtStyle): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // Ignore write failures (e.g. private browsing) — not worth surfacing.
  }
}

type ArtStyleContextValue = {
  artStyle: ArtStyle;
  setArtStyle: (style: ArtStyle) => void;
};

const ArtStyleContext = createContext<ArtStyleContextValue>({
  artStyle: 'pixel',
  setArtStyle: () => {},
});

// Experimental: lets the whole app (today, just the Today tab) switch
// between the original pixel-art look and the crayon-sketch test. Saved
// per device, defaults to Pixel. See CLAUDE.md "Crayon art-style test".
export function ArtStyleProvider({ children }: { children: ReactNode }) {
  const [artStyle, setArtStyleState] = useState<ArtStyle>('pixel');

  useEffect(() => {
    setArtStyleState(readStoredStyle());
  }, []);

  function setArtStyle(style: ArtStyle) {
    setArtStyleState(style);
    writeStoredStyle(style);
  }

  return <ArtStyleContext.Provider value={{ artStyle, setArtStyle }}>{children}</ArtStyleContext.Provider>;
}

export function useArtStyle(): ArtStyleContextValue {
  return useContext(ArtStyleContext);
}
