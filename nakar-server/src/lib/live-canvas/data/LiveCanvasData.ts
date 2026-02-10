import { LiveCanvasUndoableData } from './LiveCanvasUndoableData';
import { UndoWrapper } from '../../undo/UndoWrapper';
import { LiveCanvasViewSettings } from './LiveCanvasViewSettings';
import { LiveCanvasUser } from './LiveCanvasUser';
import z from 'zod';

export class LiveCanvasData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    undoableData: LiveCanvasUndoableData.schema,
    viewSettings: LiveCanvasViewSettings.schema,
  });

  private readonly _undoableData: UndoWrapper<LiveCanvasUndoableData>;
  private _viewSettings: LiveCanvasViewSettings;
  private readonly _users: LiveCanvasUser[];

  public constructor() {
    this._undoableData = new UndoWrapper<LiveCanvasUndoableData>(
      LiveCanvasUndoableData.empty(),
      (dataToCopy: LiveCanvasUndoableData): LiveCanvasUndoableData => {
        return dataToCopy.copy();
      },
      { maximumStackSize: 10 },
    );
    this._viewSettings = LiveCanvasViewSettings.defaultViewSettings();
    this._users = [];
  }

  public get undoableData(): UndoWrapper<LiveCanvasUndoableData> {
    return this._undoableData;
  }

  public get viewSettings(): LiveCanvasViewSettings {
    return this._viewSettings;
  }

  public get users(): LiveCanvasUser[] {
    return this._users;
  }

  public set viewSettings(newValue: LiveCanvasViewSettings) {
    this._viewSettings = newValue;
  }

  public loadFromPlain(data: z.infer<typeof LiveCanvasData.schema>): void {
    this.undoableData.reset(
      LiveCanvasUndoableData.fromPlain(data.undoableData),
    );
    this.viewSettings = LiveCanvasViewSettings.fromPlain(data.viewSettings);
  }

  public toPlain(): z.infer<typeof LiveCanvasData.schema> {
    return {
      undoableData: this._undoableData.current.toPlain(),
      viewSettings: this._viewSettings.toPlain(),
    };
  }
}
