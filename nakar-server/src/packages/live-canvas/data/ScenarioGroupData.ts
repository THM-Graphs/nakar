import type { ParameterData } from './ParameterData';

/**
 * Groups scenarios offered for nodes whose labels satisfy their parameter definitions.
 */
export interface ScenarioGroupData {
  /**
   * Canonical identity of this domain object.
   */
  id: string;

  /**
   * Display title of the object or action.
   */
  title: string | null;

  /**
   * Scenario summaries available in this group.
   */
  scenarios: {
    /**
     * Canonical identity of this domain object.
     */
    id: string;

    /**
     * Display title of the object or action.
     */
    title: string | null;

    /**
     * Parameter definitions exposed by the scenario.
     */
    parameters: ParameterData[];
  }[];
}
