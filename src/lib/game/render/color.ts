const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export const rgba = (hex: string, alpha: number): string => {
  const [r = 0, g = 0, b = 0] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const mix = (a: string, b: string, t: number): string => {
  const [ar = 0, ag = 0, ab = 0] = hexToRgb(a);
  const [br = 0, bg = 0, bb = 0] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${b2})`;
};
