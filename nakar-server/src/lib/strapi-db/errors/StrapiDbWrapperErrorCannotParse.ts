export class StrapiDbWrapperErrorCannotParse extends Error {
  causedBy: unknown;

  constructor(id: string, causedBy: unknown) {
    super(`Cannot parse object with id ${id}.`);
    this.causedBy = causedBy;
  }
}
