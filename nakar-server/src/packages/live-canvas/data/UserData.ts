import type { Position } from './Position';

/**
 * Contains an adapter-authenticated identity, a unique session ID and an optional cursor position.
 */
export interface UserData {
  /**
   * Canonical identity of this domain object.
   */
  id: string | null;

  /**
   * Unique session identity, independent of the user identity.
   */
  sessionId: string;

  /**
   * Optional display name supplied by the identity adapter.
   */
  username: string | null;

  /**
   * Position in canvas coordinates; null means that no cursor position is available.
   */
  position: Position | null;
}
