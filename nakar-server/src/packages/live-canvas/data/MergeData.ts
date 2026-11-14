/**
 * Links nodes from two source and label combinations when their configured property values match.
 */
export interface MergeData {
  /**
   * Source identity on the left side of the merge rule.
   */
  leftSourceId: string;

  /**
   * Source identity on the right side of the merge rule.
   */
  rightSourceId: string;

  /**
   * Required node label on the left side of the merge rule.
   */
  leftLabel: string;

  /**
   * Required node label on the right side of the merge rule.
   */
  rightLabel: string;

  /**
   * Property compared on the left side of the merge rule.
   */
  leftProperty: string;

  /**
   * Property compared on the right side of the merge rule.
   */
  rightProperty: string;
}
