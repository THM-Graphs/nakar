import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';
import { PhysicsSimulation } from '../../../physics/PhysicsSimulation';

export class Layout extends TransformTask {
  public constructor() {
    super('Layout');
  }

  protected async run(input: MutableGraph): Promise<void> {
    if (input.nodes.size === 0) {
      return;
    }

    const cimulation = new PhysicsSimulation(input);
    await cimulation.run(2_000);
  }
}
