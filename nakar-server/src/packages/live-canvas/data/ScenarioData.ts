import type { ParameterData } from './ParameterData';
import type { QueryData } from './QueryData';
import type { ScenarioActionData } from './ScenarioActionData';

/**
 * Contains a project scenario with parameter definitions, source queries and follow-up actions.
 */
export interface ScenarioData {
  /**
   * Canonical identity of this domain object.
   */
  id: string;

  /**
   * Identity of the project owning the room or scenario.
   */
  projectId: string;

  /**
   * Display title of the object or action.
   */
  title: string | null;

  /**
   * Parameter definitions exposed by the scenario.
   */
  parameters: ParameterData[];

  /**
   * Source queries executed in scenario order.
   */
  queries: QueryData[];

  /**
   * Follow-up operations executed after the scenario queries.
   */
  actions: ScenarioActionData[];
}
