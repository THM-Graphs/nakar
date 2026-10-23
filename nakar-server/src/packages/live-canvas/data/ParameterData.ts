/**
 * Defines a scenario parameter, its value format and the labels eligible for node-based substitution.
 */
export interface ParameterData {
  /**
   * Stable parameter identifier used as the substitution key.
   */
  identifier: string;

  /**
   * Display title of the object or action.
   */
  title: string | null;

  /**
   * Expected parameter value format.
   */
  dataType: 'string' | 'number' | 'json' | 'startDateTime' | 'endDateTime';

  /**
   * Labels whose nodes may supply this scenario parameter.
   */
  allowedLabels: string[];
}
