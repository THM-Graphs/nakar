import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';
import { PhysicsSimlulation } from '../../../physics/PhysicsSimluation';

export class ForceSimulation extends TransformTask {
  public constructor() {
    super('ForceSimulation');
  }

  protected run(input: MutableGraph): void {
    if (input.nodes.size === 0) {
      return;
    }

    const cimulation = new PhysicsSimlulation(input);
    cimulation.run(1000);
  }
}
