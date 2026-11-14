import { CanvasAction } from './CanvasAction';

/**
 * Defines the shared title and long follow-up physics policy for explicit node layouts.
 */
export abstract class LayoutAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Layout nodes';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'long';

  /** Layout changes do not reload graph-derived data. */
  public override readonly postProcess: boolean = false;
}
