import { CanvasAction } from '../actions/CanvasAction';
import type { CanvasActionContext } from '../actions/CanvasActionContext';

export class MockFailingAction extends CanvasAction {
  public readonly title: string = 'Failing action';

  public override apply(context: CanvasActionContext): void {
    context.graph.focusNodes([]);
    throw new Error('action failed');
  }
}
