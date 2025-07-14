export class FileStream {
  public constructor(
    public readonly filePath: string,
    public readonly contentType: string,
    public readonly fileName: string,
  ) {}
}
