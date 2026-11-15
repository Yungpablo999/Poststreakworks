import React from 'react';
import { Bloub, type BloubExpression, type BloubState } from './Bloub';

// Jarvis, the AI assistant, is Bloub: the violet squircle with cut-out eyes
// (github.com/jeremy-prt/bloub). It replaced the glowing flame orb. The ghost
// is still the PostStreak brand mascot; don't use it to represent Jarvis.
//
// Kept under its old name so every place that showed the flame now shows
// Bloub. It's alive on its own: it breathes, blinks and looks around.

interface JarvisOrbProps {
  size?: number;
  state?: BloubState;
  expression?: BloubExpression;
}

export function JarvisOrb({ size = 32, state, expression }: JarvisOrbProps) {
  return <Bloub size={size} state={state} expression={expression} />;
}
