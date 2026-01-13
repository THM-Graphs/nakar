import { LiveCanvasUndoableData } from './LiveCanvasUndoableData';
import { UndoWrapper } from '../../undo/UndoWrapper';
import { LiveCanvasViewSettings } from './LiveCanvasViewSettings';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { getStringPayloadOfMediaFile } from '../../media/media';
import { DatabaseService } from '../../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';

export class LiveCanvasData {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _undoableData: UndoWrapper<LiveCanvasUndoableData>;
  private _viewSettings: LiveCanvasViewSettings;

  public constructor(private readonly _database: DatabaseService) {
    this._undoableData = new UndoWrapper<LiveCanvasUndoableData>(
      LiveCanvasUndoableData.empty(),
      (data: LiveCanvasUndoableData): LiveCanvasUndoableData => {
        return data.copy();
      },
      { maximumStackSize: 10 },
    );
    this._viewSettings = LiveCanvasViewSettings.defaultViewSettings();
  }

  public get undoableData(): UndoWrapper<LiveCanvasUndoableData> {
    return this._undoableData;
  }

  public get viewSettings(): LiveCanvasViewSettings {
    return this._viewSettings;
  }

  public set viewSettings(newValue: LiveCanvasViewSettings) {
    this._viewSettings = newValue;
  }

  public async loadFromDb(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<void> {
    const undoableData: LiveCanvasUndoableData =
      await this._loadUndoableData(canvas);
    this._undoableData.reset(undoableData);
    this._viewSettings = LiveCanvasViewSettings.fromDB(canvas);
  }

  public async saveToDb(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<void> {
    await this._database.setMutableGraphOfCanvas(
      canvas,
      this._undoableData.current.toPlain(),
    );
    await this._database.setCanvasViewSettings(canvas, this._viewSettings);
  }

  private async _loadUndoableData(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<LiveCanvasUndoableData> {
    try {
      const canvasGraph: Result<'plugin::upload.file'> | null =
        await this._database.getGrapFileOfCanvas(canvas);
      const graphJson: string = await getStringPayloadOfMediaFile(canvasGraph);
      const graph: LiveCanvasUndoableData =
        LiveCanvasUndoableData.fromUnknownOrEmpty(JSON.parse(graphJson));
      this._logger.debug(
        `Did load ${graph.size.toString()} graph elements into canvas ${canvas.documentId} ('${canvas.title ?? ''}').`,
      );
      return graph;
    } catch (error) {
      this._logger.error(`Unable to load graph from canvas:`);
      this._logger.error(error);
      this._logger.debug(
        `Will init canvas ${canvas.documentId} with empty graph.`,
      );
      return LiveCanvasUndoableData.empty();
    }
  }
}
