import type { ViewSettingsData } from '../data/ViewSettingsData';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';
import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Replaces draft view settings with supplied values or the default configuration.
 */
export class SetViewSettingsAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Set view settings';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'none';

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
   * Replaces draft view settings with supplied values or the default configuration.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.settings =
      this._settings === null
        ? new CanvasViewSettings()
        : new CanvasViewSettings(structuredClone(this._settings));
  }
}
