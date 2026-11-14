/**
 * Contains the current room visibility, project membership and permitted graph sources used for authorization.
 */
export interface RoomData {
  /**
   * Canonical identity of this domain object.
   */
  id: string;

  /**
   * Identity of the project owning the room or scenario.
   */
  projectId: string;

  /**
   * Room accessibility policy used for authorization.
   */
  visibility: 'public' | 'unlisted' | 'private';

  /**
   * Project owner identity; null indicates that no owner is assigned.
   */
  ownerId: string | null;

  /**
   * Identities authorized to collaborate on the project.
   */
  collaboratorIds: string[];

  /**
   * Graph source identities belonging to the project.
   */
  sourceIds: string[];
}
