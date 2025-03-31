import { ScenarioPipelineState } from './ScenarioPipelineState';

export abstract class ScenarioPipelineStep {
  private _title: string;

  public constructor(title: string) {
    this._title = title;
  }

  public get title(): string {
    return this._title;
  }

  public abstract run(state: ScenarioPipelineState): Promise<void> | void;
}
