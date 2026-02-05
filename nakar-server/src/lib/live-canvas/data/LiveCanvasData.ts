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

  public constructor(data: {
    undoableData: LiveCanvasUndoableData;
    viewSettings: LiveCanvasViewSettings;
  }) {
    this._undoableData = new UndoWrapper<LiveCanvasUndoableData>(
      data.undoableData,
      (dataToCopy: LiveCanvasUndoableData): LiveCanvasUndoableData => {
        return dataToCopy.copy();
      },
      { maximumStackSize: 10 },
    );
    this._viewSettings = data.viewSettings;
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

  public static empty(): LiveCanvasData {
    return new LiveCanvasData({
      undoableData: LiveCanvasUndoableData.empty(),
      viewSettings: LiveCanvasViewSettings.defaultViewSettings(),
    });
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasData.schema>,
  ): LiveCanvasData {
    return new LiveCanvasData({
      undoableData: LiveCanvasUndoableData.fromPlain(data.undoableData),
      viewSettings: LiveCanvasViewSettings.fromPlain(data.viewSettings),
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasData.schema> {
    return {
      undoableData: this._undoableData.current.toPlain(),
      viewSettings: this._viewSettings.toPlain(),
    };
  }
}
