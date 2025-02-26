import { DatabaseService } from './services/database/DatabaseService';
import { RoomService } from './services/room/RoomService';
import { SocketIOInterface } from './interfaces/socketIO/SocketIOInterface';

export class NakarApplication {
  public static shared: NakarApplication = new NakarApplication();

  public readonly databaseService: DatabaseService;
  public readonly roomService: RoomService;
  public readonly socketIOInterface: SocketIOInterface;

  public constructor() {
    this.databaseService = new DatabaseService();
    this.roomService = new RoomService(this.databaseService);
    this.socketIOInterface = new SocketIOInterface(
      this.roomService,
      this.databaseService,
    );
  }

  public async bootstrap(): Promise<void> {
    await this.roomService.bootstrap();
    this.socketIOInterface.bootstrap();
  }

  public async destroy(): Promise<void> {
    await this.socketIOInterface.destroy();
  }
}
