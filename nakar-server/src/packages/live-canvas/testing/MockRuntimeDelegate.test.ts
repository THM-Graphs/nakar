import type { CanvasRuntimeDelegate } from '../delegates/CanvasRuntimeDelegate';
import type { PhysicsRuntimeDelegate } from '../physics/PhysicsRuntimeDelegate';
import type { WorkerEvent } from '../physics/WorkerEvent';
import type { MockTimer } from './MockTimer.test';

export class MockRuntimeDelegate
  implements CanvasRuntimeDelegate, PhysicsRuntimeDelegate
{
  public time: number = 0;

  public events: WorkerEvent[] = [];

  public timers: MockTimer[] = [];

  private _ids: number = 0;

  public createId(): string {
    this._ids += 1;
    return `generated-${this._ids}`;
  }

  public now(): number {
    return this.time;
  }

  public schedule(callback: () => void, milliseconds: number): unknown {
    const id: number = this.timers.length;
    this.timers.push({
      id,
      at: this.time + milliseconds,
      callback,
      cancelled: false,
    });
    return id;
  }

  public cancel(handle: unknown): void {
    const timer: MockTimer | undefined = this.timers.find(
      (entry: MockTimer): boolean => entry.id === handle,
    );
    if (timer !== undefined) {
      timer.cancelled = true;
    }
  }

  public post(event: WorkerEvent): void {
    this.events.push(structuredClone(event));
  }

  public advance(milliseconds: number): void {
    const target: number = this.time + milliseconds;
    for (;;) {
      const timer: MockTimer | undefined = this.timers.find(
        (entry: MockTimer): boolean => !entry.cancelled && entry.at <= target,
      );
      if (timer === undefined) {
        break;
      }
      this.time = timer.at;
      timer.cancelled = true;
      timer.callback();
    }
    this.time = target;
  }
}
