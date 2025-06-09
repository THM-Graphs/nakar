import { MutableGraph } from '../../graph/MutableGraph';
import { PhysicsSimulation } from '../../../../tools/physics/PhysicsSimulation';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';
import { PhysicalGraph } from '../../../../tools/physics/physical-graph/PhysicalGraph';

export class Layout extends ScenarioPipelineStep {
  public constructor() {
    super('Layout');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const input: MutableGraph = state.graph;

    if (input.nodes.size === 0) {
      return;
    }

    const physical: PhysicalGraph = input.toPhysicalGraph(state.logger);
    const simulation: PhysicsSimulation = new PhysicsSimulation(
      physical,
      state.logger,
      state.profiler,
    );

    await simulation.run({ maxMs: input.size * 10 });

    input.applyPhysicalGraph(physical, state.logger);

    state.logger.debug(
      this,
      `Average tick duration: ${simulation.averageTickDuration.toFixed(2)}`,
    );
  }
}
