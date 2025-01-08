export class StrapiDbWrapperErrorNotFound extends Error {
  public constructor(id: string) {
    super(`Document with id ${id} not found.`);
  }
}
