import { CanvasUser } from './CanvasUser';

/**
 * Represents an unauthenticated session that can use publicly accessible rooms but cannot edit project configuration.
 */
export class GuestCanvasUser extends CanvasUser {
  /**
   * Denies project editing for every unauthenticated session.
   * @returns Always false for a guest identity.
   */
  public override canEditProject(): boolean {
    return false;
  }
}
