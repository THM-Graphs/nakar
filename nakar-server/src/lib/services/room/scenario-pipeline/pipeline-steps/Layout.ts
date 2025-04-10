import { MutableGraph } from '../../graph/MutableGraph';
import { PhysicsSimulation } from '../../../../tools/physics/PhysicsSimulation';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class Layout extends ScenarioPipelineStep {
  public constructor() {
    super('Layout');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const input: MutableGraph = state.graph;

    if (input.nodes.size === 0) {
      return;
    }

    const simulation: PhysicsSimulation = new PhysicsSimulation(
      input,
      state.logger,
      state.profiler,
    );

    await simulation.run({ maxTicks: 1500, maxMs: 3000 });

    state.logger.debug(
      this,
      `Average tick duration: ${simulation.averageTickDuration.toFixed(2)}`,
    );
  }
}
