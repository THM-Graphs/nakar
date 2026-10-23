import type { CanvasEventDelegate } from '../delegates/CanvasEventDelegate';
import type { CanvasEvent } from '../events/CanvasEvent';

export class MockEventDelegate implements CanvasEventDelegate {
  public events: CanvasEvent[] = [];

  public error: Error | null = null;

  public handleEvent(event: CanvasEvent): void {
    if (this.error !== null) {
      throw this.error;
    }
    this.events.push(event);
  }
}
