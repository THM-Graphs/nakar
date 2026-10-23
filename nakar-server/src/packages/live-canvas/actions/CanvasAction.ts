import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Defines a polymorphic operation on an isolated canvas draft, including its title and requested physics duration.
 */
export abstract class CanvasAction {
  /**
   * Requested follow-up physics duration policy for the action.
   */
  public readonly physics: 'none' | 'short' | 'long' = 'short';

  /** Whether the action creates a graph history entry. */
  public readonly history: boolean = true;

  /** Whether graph-derived notes, groups and merge relationships must be refreshed. */
  public readonly postProcess: boolean = true;

  /**
   * Display title of the object or action.
   */
  public abstract readonly title: string;

  /**
   * Returns separately committed operations, preserving per-node expansion history.
   * @returns This action, or its ordered independent operations.
   */
  public get actions(): readonly CanvasAction[] {
    return [this];
  }

  /**
   * Defines a polymorphic operation on an isolated canvas draft, including its title and requested physics duration.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise for asynchronous actions, or no value for synchronous actions.
   */
  public abstract apply(context: CanvasActionContext): Promise<void> | void;
}
