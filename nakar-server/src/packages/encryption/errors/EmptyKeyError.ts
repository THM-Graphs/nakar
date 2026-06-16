export class EmptyKeyError extends Error {
  public constructor(keyId: string) {
    super(`Empty key secret for key with id ${keyId}.`);
  }
}
