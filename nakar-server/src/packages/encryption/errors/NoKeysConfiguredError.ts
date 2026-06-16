export class NoKeysConfiguredError extends Error {
  public constructor() {
    super('Keine Schlüssel konfiguriert.');
  }
}
