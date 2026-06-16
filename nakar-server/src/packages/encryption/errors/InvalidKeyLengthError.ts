export class InvalidKeyLengthError extends Error {
  public constructor(keyId: string) {
    super(`Schlüssel '${keyId}' muss 32 Byte lang sein (AES-256).`);
  }
}
