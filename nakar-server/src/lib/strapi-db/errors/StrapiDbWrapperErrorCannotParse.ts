export class StrapiDbWrapperErrorCannotParse extends Error {
  public causedBy: unknown;

  public constructor(id: string, causedBy: unknown) {
    super(`Cannot parse object with id ${id}.`);
    this.causedBy = causedBy;
  }
}
