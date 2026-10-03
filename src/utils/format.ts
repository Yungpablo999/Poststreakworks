// Plain-language numbers: 1234 -> "1.2K", 24800 -> "24.8K", 1500000 -> "1.5M".

export function compactCount(n: number): string {
  const value = Math.round(Math.abs(n));
  const scale = (divisor: number, suffix: string) => {
    const scaled = value / divisor;
    return `${scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10}${suffix}`.replace(/\.0(?=[KM])/, '');
  };
  const text = value >= 1_000_000 ? scale(1_000_000, 'M') : value >= 1_000 ? scale(1_000, 'K') : String(value);
  return n < 0 ? `-${text}` : text;
}

/** "1 post", "3 posts" */
export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
