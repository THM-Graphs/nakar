export function isLightColor(color: string): boolean {
  // Entferne '#' wenn vorhanden
  const cleanColor: string = color.replace('#', '');

  // Konvertiere 3-stellige zu 6-stelliger Hex-Farbe
  const normalizedColor: string =
    cleanColor.length === 3
      ? cleanColor
          .split('')
          .map((char: string): string => char + char)
          .join('')
      : cleanColor;

  // Extrahiere RGB Komponenten mit slice
  const r: number = parseInt(normalizedColor.slice(0, 2), 16);
  const g: number = parseInt(normalizedColor.slice(2, 4), 16);
  const b: number = parseInt(normalizedColor.slice(4, 6), 16);

  // Berechne wahrgenommene Helligkeit
  // Formel: (R * 0.299 + G * 0.587 + B * 0.114)
  const brightness: number = r * 0.299 + g * 0.587 + b * 0.114;

  // Wenn Helligkeit > 128 (von max. 255), dann ist es eine helle Farbe
  return brightness > 128;
}
