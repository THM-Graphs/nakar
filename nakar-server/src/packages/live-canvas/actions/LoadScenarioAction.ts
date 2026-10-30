import { NotFoundError } from '../error/NotFoundError';
import { ForbiddenError } from '../error/ForbiddenError';
import { InvalidDataError } from '../error/InvalidDataError';
import { DataRecord } from '../data/DataRecord';
import type { ParameterData } from '../data/ParameterData';
import type { Position } from '../data/Position';
import type { QueryResult } from '../data/QueryResult';
import type { ScenarioData } from '../data/ScenarioData';
import { SourceAction } from './SourceAction';
import type { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';
import { ScenarioActionFactory } from './ScenarioActionFactory';

/**
 * Loads or reloads an authorized scenario, resolves parameters, runs its queries and applies its follow-up actions.
 */
export class LoadScenarioAction extends SourceAction {
  /**
   * Origin recorded on graph elements inserted by this action.
   */
  public override readonly creationReason: string = 'loadScenario';

  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Load scenario';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'long';

  /**
   * Retains the selected scenario, parameter values and additive-loading policy.
   * @param _scenarioId - Scenario identity; null selects the currently active scenario where supported.
   * @param _arguments - Scenario parameter values indexed by their identifiers.
   * @param _additive - Whether scenario results extend the existing graph.
   */
  public constructor(
    private readonly _scenarioId: string | null,
    private readonly _arguments: Record<string, string> = {},
    private readonly _additive: boolean = false,
  ) {
    super();
  }

  /**
   * Loads or reloads an authorized scenario, resolves parameters, runs its queries and applies its follow-up actions.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public override async apply(context: CanvasActionContext): Promise<void> {
    const id: string | null = this._scenarioId ?? context.data.graph.scenarioId;
    if (id === null) {
      throw new NotFoundError('No scenario to reload.');
    }
    const scenario: ScenarioData =
      await context.delegates.storage.getScenario(id);
    if (scenario.projectId !== context.room.projectId) {
      throw new ForbiddenError('Scenario does not belong to the project.');
    }
    if (scenario.queries.length === 0) {
      throw new NotFoundError('Scenario has no queries.');
    }
    const args: Record<string, string> =
      this._scenarioId === null
        ? context.data.graph.arguments
        : this._arguments;
    const converted: Record<string, unknown> = DataRecord.empty<unknown>();
    for (const [key, value] of Object.entries(args)) {
      const parameter: ParameterData | undefined = scenario.parameters.find(
        (candidate: ParameterData): boolean => candidate.identifier === key,
      );
      if (parameter === undefined) {
        throw new InvalidDataError(`Unknown parameter ${key}.`);
      }
      if (parameter.dataType === 'number') {
        if (value.trim().length === 0 || !Number.isFinite(Number(value))) {
          throw new InvalidDataError('Invalid number parameter.');
        }
        converted[key] = Number(value);
      } else if (parameter.dataType === 'json') {
        converted[key] = JSON.parse(value) as unknown;
      } else {
        converted[key] = value;
      }
    }
    const results: QueryResult[] = [];
    const table: CanvasActionContext['data']['graph']['table'] = [];
    for (const query of scenario.queries) {
      if (query.query === null) {
        continue;
      }
      const result: QueryResult = await context.request(query.sourceId, {
        type: 'query',
        query,
        arguments: converted,
      });
      if (query.isTableQuery) {
        table.push(...result.table);
        if (result.limitReached) {
          context.limits.push(
            result.nodes.length + result.edges.length + result.table.length,
          );
        }
      } else {
        results.push(result);
      }
    }
    const positions: Record<string, Position> = DataRecord.empty<Position>();
    for (const node of context.graph.toData().nodes) {
      positions[node.id] = { ...node.position };
    }
    if (!this._additive) {
      context.graph.focusNodes([]);
      context.data.graph.scenarioId = scenario.id;
      context.data.graph.arguments = structuredClone(args);
      context.data.graph.parameters = structuredClone(scenario.parameters);
      context.title = scenario.title ?? 'New Canvas';
    }
    context.data.graph.table = structuredClone(table);
    this.add(context, ...results);
    for (const node of context.data.graph.nodes) {
      if (Object.hasOwn(positions, node.id)) {
        node.position = { ...positions[node.id] };
      }
    }
    if (!this._additive) {
      const factory: ScenarioActionFactory = new ScenarioActionFactory();
      for (const action of scenario.actions) {
        await factory.create(action).apply(context);
      }
    }
  }
}
