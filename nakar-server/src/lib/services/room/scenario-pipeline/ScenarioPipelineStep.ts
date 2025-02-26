export abstract class ScenarioPipelineStep<O> {
  private _title: string;

  public constructor(title: string) {
    this._title = title;
  }

  public get title(): string {
    return this._title;
  }

  public abstract run(): Promise<O> | O;
}
