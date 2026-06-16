export class UnknownKeyIdError extends Error {
  public constructor(keyId: string) {
    super(`Kein Schlüssel mit ID '${keyId}' gefunden.`);
  }
}
