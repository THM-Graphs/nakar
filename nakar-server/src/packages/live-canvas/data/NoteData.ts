/**
 * Contains a note and the canonical node IDs to which it belongs.
 */
export interface NoteData {
  /**
   * Canonical identity of this domain object.
   */
  id: string;

  /**
   * Note content supplied by the storage adapter.
   */
  content: string;

  /**
   * Canonical node identities selected by this operation.
   */
  nodeIds: string[];

  /**
   * Optional author identity and display name.
   */
  author: {
    /**
     * Canonical identity of this domain object.
     */
    id: string;

    /**
     * Optional display name supplied by the identity adapter.
     */
    username: string | null;
  } | null;

  /**
   * Optional adapter-provided timestamp string of the last update.
   */
  updatedAt: string | null;
}
