import { SourceAction } from '../actions/SourceAction';
import type { CanvasActionContext } from '../actions/CanvasActionContext';
import type { QueryResult } from '../data/QueryResult';

export class MockSourceAction extends SourceAction {
  public readonly title: string = 'Mock source action';

  public constructor(private readonly _result: QueryResult) {
    super();
  }

  public override apply(context: CanvasActionContext): void {
    this.add(context, this._result);
  }
}
