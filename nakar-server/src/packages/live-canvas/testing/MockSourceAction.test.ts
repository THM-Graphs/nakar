import { SourceAction } from '../actions/SourceAction';
import type { CanvasActionContext } from '../actions/CanvasActionContext';
import type { QueryResult } from '../data/QueryResult';

export class MockSourceAction extends SourceAction {
  public readonly title: string = 'Mock source action';

  private readonly _results: QueryResult[];

  public constructor(...results: QueryResult[]) {
    super();
    this._results = results;
  }

  public override apply(context: CanvasActionContext): void {
    this.add(context, ...this._results);
  }
}
