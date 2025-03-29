import { MutableGraph } from '../../graph/MutableGraph';
import { PhysicsSimulation } from '../../../../tools/physics/PhysicsSimulation';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { LoggerService } from '../../../logger/LoggerService';
import { ProfilerService } from '../../../profiler/ProfilerService';

export class Layout extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;

  public constructor(
    graph: MutableGraph,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
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
      this._profiler,
    );
    await simulation.run(1500);

    this._logger.debug(
      this,
      `Average tick duration: ${simulation.averageTickDuration.toFixed(2)}`,
    );
  }
}
