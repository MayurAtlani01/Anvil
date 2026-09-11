export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  if (!hex || typeof hex !== 'string') {
    return { r: 255, g: 104, b: 69 };
  }

  const clean = hex.trim().replace(/^#/, '');

  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b };
    }
  }

  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b };
    }
  }

  return { r: 255, g: 104, b: 69 };
}

export function getRgbString(color: string): string {
  const { r, g, b } = hexToRgb(color);
  return `${r}, ${g}, ${b}`;
}

export function getAccentGlow(color: string, alpha = 0.35): string {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getAccentSurface(color: string, alpha = 0.1): string {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getAccentBorder(color: string, alpha = 0.3): string {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getContrastTextColor(hex: string): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? '#0D0F10' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

/**
 * Returns a complete dictionary of CSS variable tokens dynamically derived from an accent color.
 * This ensures that when the user picks any accent color, ALL glows, surface tints, borders,
 * active indicators, and text colors update cohesively throughout the entire application.
 */
export function getAccentStyles(accentColor: string): Record<string, string> {
  const { r, g, b } = hexToRgb(accentColor);
  const rgb = `${r}, ${g}, ${b}`;

  return {
    '--anvil-accent': accentColor,
    '--brand-primary': accentColor,
    '--accent-color': accentColor,
    '--anvil-accent-rgb': rgb,
    '--anvil-accent-glow': `rgba(${rgb}, 0.35)`,
    '--anvil-accent-glow-subtle': `rgba(${rgb}, 0.16)`,
    '--anvil-accent-glow-strong': `rgba(${rgb}, 0.55)`,
    '--anvil-accent-surface': `rgba(${rgb}, 0.10)`,
    '--anvil-accent-surface-hover': `rgba(${rgb}, 0.18)`,
    '--anvil-accent-border': `rgba(${rgb}, 0.28)`,
    '--anvil-accent-border-active': `rgba(${rgb}, 0.55)`,
  };
}
