import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useFloatingLambActive } from '../../lib/lamb-overlay-context';
import { Lamb } from '../pixel/Lamb';
import { COLORS, FONTS, HARD_SHADOW } from '../theme';
import { Sparkles } from './Sparkles';

const BOX_SIZE = 72;
const MARGIN = 10;
const BUBBLE_WIDTH = 230;
const TAP_THRESHOLD = 6; // px of movement below which a release counts as a tap, not a drag

// Only auto-peek once per full app load (module-level, not per-component-
// instance state, so it survives the lamb unmounting/remounting with auth).
let hasPeeked = false;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function FloatingLamb() {
  const { width, height } = useWindowDimensions();
  const active = useFloatingLambActive();
  const [pos, setPos] = useState(() => ({
    x: width - BOX_SIZE - MARGIN,
    y: height - BOX_SIZE - 90,
  }));
  const [open, setOpen] = useState(() => {
    if (hasPeeked) return false;
    hasPeeked = true;
    return true;
  });
  // Drag via native Pointer Events (with capture) rather than PanResponder —
  // PanResponder's legacy web responder only keeps tracking a drag while the
  // cursor stays over the lamb's small hitbox, which loses the gesture the
  // moment a real drag moves faster than that. Pointer capture keeps
  // delivering move/up events to this element no matter where the pointer
  // goes, which is what makes dragging a small icon actually work on web.
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: number } | null>(
    null
  );

  function handlePointerDown(event: any) {
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, originX: pos.x, originY: pos.y, moved: 0 };
  }

  function handlePointerMove(event: any) {
    const drag = dragState.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.moved = Math.abs(dx) + Math.abs(dy);
    setPos({
      x: clamp(drag.originX + dx, MARGIN, width - BOX_SIZE - MARGIN),
      y: clamp(drag.originY + dy, MARGIN, height - BOX_SIZE - MARGIN),
    });
  }

  function handlePointerUp(event: any) {
    event.currentTarget?.releasePointerCapture?.(event.pointerId);
    if (dragState.current && dragState.current.moved < TAP_THRESHOLD) {
      setOpen((current) => !current);
    }
    dragState.current = null;
  }

  const openLeft = pos.x + BOX_SIZE / 2 > width / 2;
  const openAbove = pos.y + BOX_SIZE / 2 > height / 2;
  const messages = Array.isArray(active.message) ? active.message : [active.message];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.wrap, { left: pos.x, top: pos.y }]}>
        {open && (
          <View
            style={[
              styles.bubble,
              openLeft ? styles.bubbleLeft : styles.bubbleRight,
              openAbove ? styles.bubbleAbove : styles.bubbleBelow,
            ]}
          >
            <Pressable style={styles.closeButton} onPress={() => setOpen(false)} hitSlop={8}>
              <Text style={styles.closeGlyph}>×</Text>
            </Pressable>
            <Text style={styles.message}>{messages[0]}</Text>
            {active.actions && active.actions.length > 0 && (
              <View style={styles.actionsRow}>
                {active.actions.map((action) => (
                  <Pressable
                    key={action.label}
                    style={[styles.actionButton, action.primary && styles.actionButtonPrimary]}
                    onPress={action.onPress}
                  >
                    <Text style={styles.actionText}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        <View
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={styles.lambBox}
        >
          <Lamb mood={active.pose ?? 'happy'} pixelSize={2.5} />
          {active.sparkles && <Sparkles />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: BOX_SIZE,
    height: BOX_SIZE,
  },
  lambBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // react-native-web-only CSS props (prevent the browser's own touch
    // scroll/text-select from fighting the drag) — not in RN's ViewStyle
    // type, so cast.
    ...({ touchAction: 'none', userSelect: 'none' } as object),
  },
  bubble: {
    ...HARD_SHADOW,
    position: 'absolute',
    width: BUBBLE_WIDTH,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingRight: 26,
  },
  bubbleLeft: {
    right: BOX_SIZE - 10,
  },
  bubbleRight: {
    left: BOX_SIZE - 10,
  },
  bubbleAbove: {
    bottom: 0,
  },
  bubbleBelow: {
    top: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 15,
    lineHeight: 15,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.textMuted,
  },
  message: {
    fontFamily: FONTS.headingMedium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: COLORS.cream,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.sage,
  },
  actionText: {
    fontFamily: FONTS.headingSemiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
});
