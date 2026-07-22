import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { MonitoringEvent } from './MonitoringEvent';
import { createChildLogger } from '../logger/createChildLogger';
import { Logger } from '@strapi/logger';
import { DatabaseService } from '../database/DatabaseService';
import type { Modules } from '@strapi/types';

@Injectable()
export class MonitoringService implements OnModuleDestroy {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _databaseService: DatabaseService) {}

  public pushEvent(monitoringEvent: MonitoringEvent): void {
    void this._loadAndHandleEvent(monitoringEvent);
  }

  public async onModuleDestroy(): Promise<void> {
    await this._loadAndHandleEvent({
      type: 'application_will_shutdown',
      userInfo: null,
      objectInfo: null,
      metaData: null,
    });
  }

  private async _loadAndHandleEvent(
    monitoringEvent: MonitoringEvent,
  ): Promise<void> {
    try {
      const date: Date = new Date();

      const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
        monitoringEvent.userInfo?.userId != null
          ? await this._databaseService.getUser(monitoringEvent.userInfo.userId)
          : null;

      const canvas: Modules.Documents.Result<'api::canvas.canvas'> | null =
        monitoringEvent.objectInfo?.canvasId != null
          ? await this._databaseService.getCanvasOrNull(
              monitoringEvent.objectInfo.canvasId,
            )
          : null;
      const room: Modules.Documents.Result<'api::room.room'> | null =
        monitoringEvent.objectInfo?.roomId != null
          ? await this._databaseService.getRoom(
              monitoringEvent.objectInfo.roomId,
            )
          : canvas != null
            ? await this._databaseService.getRoomOfCanvas(canvas)
            : null;
      const project: Modules.Documents.Result<'api::project.project'> | null =
        monitoringEvent.objectInfo?.projectId != null
          ? await this._databaseService.getProject(
              monitoringEvent.objectInfo.projectId,
            )
          : room != null
            ? await this._databaseService.getProjectOfRoom(room)
            : null;

      this._logger.info(
        JSON.stringify({
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
        }),
      );
    } catch (error: unknown) {
      this._logger.error(
        `Error fetching data for monitoring. Data: ${JSON.stringify(monitoringEvent)}`,
      );
      this._logger.error(error);
    }
  }
}
