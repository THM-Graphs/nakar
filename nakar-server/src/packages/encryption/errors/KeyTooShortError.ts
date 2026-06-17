export class KeyTooShortError extends Error {
  public constructor(keyId: string) {
    super(`Key of id '${keyId}' does not meet minimum key length criteria.`);
  }
}
