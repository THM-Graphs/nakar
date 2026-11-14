/**
 * Describes one source query and whether its result is used as a table.
 */
export interface QueryData {
  /**
   * Identity of the graph source used for the operation.
   */
  sourceId: string;

  /**
   * Source query text; null means that no query text is configured.
   */
  query: string | null;

  /**
   * Whether the source result is interpreted as a table.
   */
  isTableQuery: boolean;
}
