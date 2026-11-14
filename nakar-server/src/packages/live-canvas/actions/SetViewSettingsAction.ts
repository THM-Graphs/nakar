import type { ViewSettingsData } from '../data/ViewSettingsData';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';
import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Merges incoming view settings while retaining unrelated entries, or resets the configuration explicitly.
 */
export class SetViewSettingsAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Set view settings';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'short';

  /** Visualization changes preserve graph history and redo entries. */
  public override readonly history: boolean = false;

  /**
   * Retains an optional configuration; omission resets the canvas to defaults when applied.
   * @param _settings - Visualization configuration to reference.
   */
  public constructor(
    private readonly _settings: ViewSettingsData | null = null,
  ) {
    super();
  }

  /**
   * Merges supplied settings into the draft, or resets all settings when no values were supplied.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    if (this._settings === null) {
      context.settings = new CanvasViewSettings();
    } else {
      context.settings.merge(this._settings);
    }
  }
}
