import type { PhysicsWorkerDelegate } from '../delegates/PhysicsWorkerDelegate';
import type { PhysicsWorkerListener } from '../delegates/PhysicsWorkerListener';
import type { WorkerCommand } from '../physics/WorkerCommand';

export class MockWorkerDelegate implements PhysicsWorkerDelegate {
  public postError: Error | null = null;

  public listener: PhysicsWorkerListener | null = null;

  public commands: WorkerCommand[] = [];

  public starts: number = 0;

  public terminations: number = 0;

  public startError: Error | null = null;

  public terminateError: Error | null = null;

  public start(listener: PhysicsWorkerListener): Promise<void> {
    this.starts += 1;
    this.listener = listener;
    return this.startError === null
      ? Promise.resolve()
      : Promise.reject(this.startError);
  }

  public post(command: WorkerCommand): void {
    if (this.postError !== null) {
      throw this.postError;
    }
    this.commands.push(structuredClone(command));
  }

  public terminate(): Promise<void> {
    this.terminations += 1;
    return this.terminateError === null
      ? Promise.resolve()
      : Promise.reject(this.terminateError);
  }
}
