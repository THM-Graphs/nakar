import type { MonitoringEventType } from './MonitoringEventType';

export interface MonitoringEvent {
  type: MonitoringEventType;
  userInfo: {
    userId: string | null;
    socketId: string | null;
  } | null;
  objectInfo: {
    canvasId: string | null;
    roomId: string | null;
    projectId: string | null;
  } | null;
  metaData: Record<string, string | null> | null;
}
