import { MutableGraph } from '../graph/MutableGraph';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';
import { ScenarioPipelineState } from './ScenarioPipelineState';

export class ScenarioPipelineResult {
  public readonly graph: MutableGraph;
  public readonly scenario: GetScenarioDBDTO;

  public constructor(scenarioState: ScenarioPipelineState) {
    this.graph = scenarioState.graph;
    this.scenario = scenarioState.scenarioDBDTO;
  }
}
