import { MutableGraph } from '../../graph/MutableGraph';
import { PhysicsSimulation } from '../../../../tools/physics/PhysicsSimulation';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { LoggerService } from '../../../logger/LoggerService';

export class Layout extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;

  public constructor(
    graph: MutableGraph,
    private readonly _logger: LoggerService,
  ) {
    super('Layout');
    this._graph = graph;
  }

  public async run(): Promise<void> {
    const input: MutableGraph = this._graph;

    if (input.nodes.size === 0) {
      return;
    }

    const simulation: PhysicsSimulation = new PhysicsSimulation(
      input,
      this._logger,
    );
    await simulation.run(1000);
  }
}
