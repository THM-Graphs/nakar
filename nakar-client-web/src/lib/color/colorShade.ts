export function adjustColor(hex: string, factor: number): string {
  // Sicherstellen, dass der Hex-Wert mit # beginnt und 6 Zeichen lang ist
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
    throw new Error("Ungültiger Hex-Farbwert");
  }

  // Dreistelligen Hex-Wert in einen sechsstelligen umwandeln
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  // Hex-Farbe in RGB aufteilen
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  // Helligkeit anpassen
  const adjust = (channel: number) => {
    const adjustment =
      factor > 0
        ? channel + (255 - channel) * factor // Aufhellen
        : channel + channel * factor; // Abdunkeln
    return Math.min(255, Math.max(0, Math.floor(adjustment)));
  };

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  // RGB zurück in Hex umwandeln
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
