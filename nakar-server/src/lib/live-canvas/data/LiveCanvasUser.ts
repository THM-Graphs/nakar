export class LiveCanvasUser {
  private readonly _databaseId: string | null;
  private readonly _socketId: string;
  private readonly _username: string;
  private _canvasPosition: [number, number] | null;

  public constructor(data: {
    databaseId: string | null;
    socketId: string;
    username: string;
    canvasPosition: [number, number] | null;
  }) {
    this._databaseId = data.databaseId;
    this._socketId = data.socketId;
    this._username = data.username;
    this._canvasPosition = data.canvasPosition;
  }

  public get databaseId(): string | null {
    return this._databaseId;
  }

  public get socketId(): string {
    return this._socketId;
  }

  public get username(): string {
    return this._username;
  }

  public get canvasPosition(): [number, number] | null {
    return this._canvasPosition;
  }

  public set canvasPosition(newValue: [number, number] | null) {
    this._canvasPosition = newValue;
  }
}
