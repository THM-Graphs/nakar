import { MutableGraph } from '../../graph/MutableGraph';
import { PhysicsSimulation } from '../../physics/PhysicsSimulation';
import { wait } from '../../tools/Wait';
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

    const cimulation: PhysicsSimulation = new PhysicsSimulation(input);
    const start: number = Date.now();
    cimulation.start();

    await wait(2000);

    cimulation.stop();
    const end: number = Date.now();
    const ticksPerSecs: number = cimulation.tickCount / ((end - start) / 1000);
    strapi.log.debug(`Ticks per seconds: ${ticksPerSecs.toFixed(2)}`);
  }
}
