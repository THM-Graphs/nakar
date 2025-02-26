import { DocumentsDatabase } from '../documents/DocumentsDatabase';
import { RoomSessionManager } from '../room/RoomSessionManager';
import { WebSocketsManager } from '../ws/WebSocketsManager';

export class NakarCore {
  public static shared: NakarCore = new NakarCore();

  public readonly database: DocumentsDatabase;
  public readonly roomSessionManager: RoomSessionManager;
  public readonly webSocketsManager: WebSocketsManager;

  public constructor() {
    this.database = new DocumentsDatabase();
    this.roomSessionManager = new RoomSessionManager(this.database);
    this.webSocketsManager = new WebSocketsManager(
      this.roomSessionManager,
      this.database,
    );
  }

  public async bootstrap(): Promise<void> {
    await this.roomSessionManager.bootstrap();
    this.webSocketsManager.bootstrap();
  }

  public async destroy(): Promise<void> {
    await this.webSocketsManager.destroy();
  }
}
