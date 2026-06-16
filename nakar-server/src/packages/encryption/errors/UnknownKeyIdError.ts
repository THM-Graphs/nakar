export class UnknownKeyIdError extends Error {
  public constructor(keyId: string) {
    super(`Encryption key '${keyId}' not found.`);
  }
}
