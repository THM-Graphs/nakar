import { Injectable } from '@nestjs/common';
import { MonitoringEvent } from './MonitoringEvent';
import { createChildLogger } from '../logger/createChildLogger';
import { Logger } from '@strapi/logger';
import { DatabaseService } from '../database/DatabaseService';
import { Result } from '@strapi/types/dist/modules/documents';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { Profiler } from 'winston';

@Injectable()
export class MonitoringService {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _databaseService: DatabaseService) {}

  public pushEvent(monitoringEvent: MonitoringEvent): void {
    void this._loadAndHandleEvent(monitoringEvent);
  }

  private async _loadAndHandleEvent(
    monitoringEvent: MonitoringEvent,
  ): Promise<void> {
    const profiler: Profiler = this._logger.startTimer();
    try {
      const date: Date = new Date();

      const user: Result<'plugin::users-permissions.user'> | null =
        monitoringEvent.userInfo?.userId != null
          ? await this._databaseService.getUser(monitoringEvent.userInfo.userId)
          : null;

      const canvas: Result<'api::canvas.canvas'> | null =
        monitoringEvent.objectInfo?.canvasId != null
          ? await this._databaseService.getCanvasOrNull(
              monitoringEvent.objectInfo.canvasId,
            )
          : null;
      const room: Result<'api::room.room'> | null =
        monitoringEvent.objectInfo?.roomId != null
          ? await this._databaseService.getRoom(
              monitoringEvent.objectInfo.roomId,
            )
          : canvas != null
            ? await this._databaseService.getRoomOfCanvas(canvas)
            : null;
      const project: Result<'api::project.project'> | null =
        monitoringEvent.objectInfo?.projectId != null
          ? await this._databaseService.getProject(
              monitoringEvent.objectInfo.projectId,
            )
          : room != null
            ? await this._databaseService.getProjectOfRoom(room)
            : null;

      const document: Result<'api::monitoring-event.monitoring-event'> =
        await strapi
          .documents('api::monitoring-event.monitoring-event')
          .create({
            data: {
              type: monitoringEvent.type,
              dateTime: date.toISOString(),
              socketId: monitoringEvent.userInfo?.socketId ?? undefined,
              userId: monitoringEvent.userInfo?.userId ?? undefined,
              username: user?.username ?? undefined,
              canvasId: canvas?.documentId ?? undefined,
              canvasTitle: canvas?.title ?? undefined,
              roomId: room?.documentId,
              roomTitle: room?.title ?? undefined,
              projectId: project?.documentId,
              projectTitle: project?.title ?? undefined,
              metaData: monitoringEvent.metaData,
            } satisfies Input<'api::monitoring-event.monitoring-event'>,
          });

      this._logger.info(JSON.stringify(document));
    } catch (error: unknown) {
      this._logger.error(
        `Error fetching data for monitoring. Data: ${JSON.stringify(monitoringEvent)}`,
      );
      this._logger.error(error);
    }
    profiler.done({
      logLevel: 'debug',
      message: 'Did create monitoring event.',
    });
  }
}
