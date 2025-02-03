import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';
import { PhysicsSimulation } from '../../../physics/PhysicsSimulation';
import { wait } from '../../../tools/Wait';

export class Layout extends TransformTask {
  public constructor() {
    super('Layout');
  }

  protected async run(input: MutableGraph): Promise<void> {
    if (input.nodes.size === 0) {
      return;
    }

    const cimulation = new PhysicsSimulation(input);
    const start = Date.now();
    cimulation.start();

    await wait(2000);

    cimulation.stop();
    const end = Date.now();
    const ticksPerSecs = cimulation.tickCount / ((end - start) / 1000);
    strapi.log.debug(`Ticks per seconds: ${ticksPerSecs.toFixed(2)}`);
  }
}
