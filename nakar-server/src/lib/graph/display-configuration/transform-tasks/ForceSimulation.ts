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
    cimulation.start();
    await wait(2000);
    cimulation.stop();
  }
}
