import type { RoomData } from '../data/RoomData';
import type { UserData } from '../data/UserData';
import { CanvasError } from '../CanvasError';

/**
 * References a trusted identity and defines polymorphic room-use and project-editing permissions.
 */
export abstract class CanvasUser {
  /**
   * References the adapter-authenticated identity data; authentication itself belongs to the host.
   * @param _data - Data object or snapshot used to initialize the operation.
   */
  public constructor(protected readonly _data: UserData) {}

  /**
   * Checks whether this identity may use the current room according to its visibility and project membership.
   * @param room - Current room access and project membership data.
   * @returns True for public or unlisted rooms, or when project membership permits access to a private room.
   */
  public canUse(room: RoomData): boolean {
    return room.visibility !== 'private' || this.canEditProject(room);
  }

  /**
   * Throws a forbidden domain error when this identity lacks the requested room or project-editing permission.
   * @param room - Current room access and project membership data.
   * @param project - Whether project-editing permission is required instead of room-use permission.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public requireAccess(room: RoomData, project: boolean = false): void {
    if (!(project ? this.canEditProject(room) : this.canUse(room))) {
      throw new CanvasError('forbidden', 'User cannot access this canvas.');
    }
  }

  /**
   * Returns a deep snapshot that callers can modify without mutating the referenced data.
   * @returns A deep snapshot that callers can modify without mutating the referenced data.
   */
  public toData(): UserData {
    return structuredClone(this._data);
  }

  /**
   * Checks whether this identity owns the project or is one of its collaborators.
   * @param room - Current room access and project membership data.
   * @returns Whether the concrete identity is authorized to edit this project.
   */
  public abstract canEditProject(room: RoomData): boolean;
}
