import type { RoomData } from '../data/RoomData';
import { CanvasUser } from './CanvasUser';

/**
 * Represents an authenticated identity whose project editing rights depend on ownership or collaboration.
 */
export class AuthenticatedCanvasUser extends CanvasUser {
  /**
   * Grants project editing to the owner and listed collaborators.
   * @param room - Current room access and project membership data.
   * @returns True when the identity matches the project owner or a listed collaborator.
   */
  public override canEditProject(room: RoomData): boolean {
    return (
      this._data.id !== null &&
      (room.ownerId === this._data.id ||
        room.collaboratorIds.includes(this._data.id))
    );
  }
}
