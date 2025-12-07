export interface RoomServiceEventError {
  type: 'RoomServiceEventError';
  roomId: string;
  error: unknown;
}
