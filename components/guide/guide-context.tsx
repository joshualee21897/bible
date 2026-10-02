import { createContext, useCallback, useContext, useRef, type PropsWithChildren } from 'react';

// Remembers which lamb guide bubbles have already been shown this visit, so
// a bubble only auto-opens (with its "Tap me anytime" hint) the first time —
// after that it stays tucked away until someone taps the lamb again. This is
// in-memory only and resets the next time the app is opened, by design (no
// extra storage library needed for a gentle one-time tip).
type GuideContextValue = {
  hasSeen: (id: string) => boolean;
  markSeen: (id: string) => void;
};

const GuideContext = createContext<GuideContextValue | null>(null);

export function LambGuideProvider({ children }: PropsWithChildren) {
  const seen = useRef<Set<string>>(new Set());

  const hasSeen = useCallback((id: string) => seen.current.has(id), []);
  const markSeen = useCallback((id: string) => {
    seen.current.add(id);
  }, []);

  return <GuideContext.Provider value={{ hasSeen, markSeen }}>{children}</GuideContext.Provider>;
}

export function useLambGuideSeen() {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error('useLambGuideSeen must be used within a LambGuideProvider');
  }
  return context;
}
