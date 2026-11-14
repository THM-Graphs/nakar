import { CanvasUser } from './CanvasUser';

/**
 * Represents a trusted root identity with unrestricted room-use and project-editing permissions.
 */
export class RootUser extends CanvasUser {
  /**
   * Grants project editing independently of room visibility, ownership and collaboration.
   * @returns Always true for a root identity.
   */
  public override canEditProject(): boolean {
    return true;
  }
}
