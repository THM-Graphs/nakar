import type { DatabaseService } from '../database/DatabaseService';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { LiveCanvasData } from './graph/LiveCanvasData';
import type { ApplicationService } from '../application/ApplicationService';
import installHandlebarHelpers from 'handlebars-helpers';
import { SMap } from '../map/Map';
import type { Neo4jService } from '../neo4j/Neo4jService';
import type { CanvasEvent } from './events/CanvasEvent';
import type { CanvasEventEventKick } from './events/CanvasEventEventKick';
import { LiveCanvas } from './LiveCanvas';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { createChildLogger } from '../logger/createChildLogger';
import { Logger } from '@strapi/logger';
import { Profiler } from 'winston';
import { DatabaseEventsService } from '../database/DatabaseEventsService';

export class CanvasService implements ApplicationService {
  private readonly _logger: Logger = createChildLogger(this);
  private readonly _liveCanvases: SMap<string, LiveCanvas>;
  private readonly _onEvent: Subject<CanvasEvent>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _databaseEvents: DatabaseEventsService,
    private readonly _neo4j: Neo4jService,
  ) {
    this._liveCanvases = new SMap();
    this._onEvent = new Subject();
  }

  public get onEvent$(): Observable<CanvasEvent> {
    return this._onEvent.asObservable();
  }

  public bootstrap(): void {
    installHandlebarHelpers();

    this._databaseEvents.onCanvasDeleted$.subscribe(
      (canvas: Result<'api::v2-canvas.v2-canvas'>): void => {
        this._destroyCanvas(canvas).catch((error: unknown): void => {
          this._logger.error(error);
        });
      },
    );
  }

  public async destroy(): Promise<void> {
    for (const canvas of this._liveCanvases.values()) {
      this._logger.info(`Stopping live canvas ${canvas.canvasId}...`);
      await canvas.destroy();
    }
  }

  public getGraph(canvas: Result<'api::v2-canvas.v2-canvas'>): LiveCanvasData {
    const liveCanvas: LiveCanvas = this.getCanvas(canvas);
    const graph: LiveCanvasData = liveCanvas.getGraph();
    return graph;
  }

  public getGraphOrNull(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): LiveCanvasData | null {
    return this._liveCanvases.get(canvas.documentId)?.getGraph() ?? null;
  }

  public getCanvas(canvas: Result<'api::v2-canvas.v2-canvas'>): LiveCanvas {
    return this.getCanvasWithId(canvas.documentId);
  }

  public getCanvasOrNull(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): LiveCanvas | null {
    return this.getCanvasWithIdOrNull(canvas.documentId);
  }

  public getCanvasWithIdOrNull(roomId: string): LiveCanvas | null {
    const liveCanvas: LiveCanvas | null =
      this._liveCanvases.get(roomId) ?? null;
    return liveCanvas;
  }

  public getCanvasWithId(roomId: string): LiveCanvas {
    const liveCanvas: LiveCanvas | null = this.getCanvasWithIdOrNull(roomId);
    if (liveCanvas == null) {
      throw new Error(`Canvas ${roomId} is not alive yet.`);
    }
    return liveCanvas;
  }

  public getOrStartCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): LiveCanvas {
    const exitsingCanvas: LiveCanvas | null =
      this._liveCanvases.get(canvas.documentId) ?? null;
    if (exitsingCanvas != null) {
      exitsingCanvas.cancelShutdown();
      return exitsingCanvas;
    }

    const task: Profiler = this._logger.startTimer();
    const liveCanvas: LiveCanvas = new LiveCanvas(
      canvas.documentId,
      this._database,
      this._neo4j,
    );

    this._liveCanvases.set(canvas.documentId, liveCanvas);

    liveCanvas.addSubscription(
      liveCanvas.onEvent$.subscribe((event: CanvasEvent): void => {
        if (event.type === 'CanvasEventShouldShutDown') {
          this._destroyCanvas(canvas).catch((error: unknown): void => {
            this._logger.error(error);
          });
        } else {
          this._onEvent.next(event);
        }
      }),
    );

    liveCanvas.bootstrap();

    task.done({
      message: `Init canvas ${canvas.title ?? canvas.documentId}`,
    });

    return liveCanvas;
  }

  public scheduleCanvasShutdown(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): void {
    const liveCanvas: LiveCanvas | undefined = this._liveCanvases.get(
      canvas.documentId,
    );

    if (liveCanvas == null) {
      return;
    }

    liveCanvas.scheduleShutdown();
  }

  private async _destroyCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<void> {
    this._logger.debug(`Will destroy canvas ${canvas.documentId}.`);
    const liveCanvas: LiveCanvas | undefined = this._liveCanvases.get(
      canvas.documentId,
    );

    if (liveCanvas == null) {
      return;
    }

    this._liveCanvases.delete(canvas.documentId);

    this._onEvent.next({
      type: 'CanvasEventKick',
      canvasId: canvas.documentId,
    } satisfies CanvasEventEventKick);

    await liveCanvas.destroy();
  }
}
