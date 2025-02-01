import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';
import { PhysicsSimulation } from '../../../physics/PhysicsSimulation';

export class ForceSimulation extends TransformTask {
  public constructor() {
    super('ForceSimulation');
  }

  protected run(input: MutableGraph): void {
    if (input.nodes.size === 0) {
      return;
    }

    const cimulation = new PhysicsSimulation(input);
    cimulation.run(1000);
  }
}
