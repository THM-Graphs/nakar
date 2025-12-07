export class TaskQueueTask {
  public constructor(
    public readonly title: string,
    public readonly action: () => Promise<void> | void,
  ) {}
}
