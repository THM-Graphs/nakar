import { MutableGraph } from '../../graph/MutableGraph';
import { PhysicsSimulation } from '../../physics/PhysicsSimulation';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';

export class Layout extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;

  public constructor(graph: MutableGraph) {
    super('Layout');
    this._graph = graph;
  }

  public async run(): Promise<void> {
    const input: MutableGraph = this._graph;

    if (input.nodes.size === 0) {
      return;
    }

    const simulation: PhysicsSimulation = new PhysicsSimulation(input);
    await simulation.run(1000);
  }
}
