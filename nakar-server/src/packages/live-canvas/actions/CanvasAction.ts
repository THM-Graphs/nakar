import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Defines a polymorphic operation on an isolated canvas draft, including its title and requested physics duration.
 */
export abstract class CanvasAction {
  /**
   * Requested follow-up physics duration policy for the action.
   */
  public readonly physics: 'none' | 'short' | 'long' = 'short';

  /**
   * Display title of the object or action.
   */
  public abstract readonly title: string;

  /**
   * Defines a polymorphic operation on an isolated canvas draft, including its title and requested physics duration.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise for asynchronous actions, or no value for synchronous actions.
   */
  public abstract apply(context: CanvasActionContext): Promise<void> | void;
}
