export class NoKeysConfiguredError extends Error {
  public constructor() {
    super('No encryption keys configured.');
  }
}
