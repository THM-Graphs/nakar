import { Profiler } from './Profiler';

export class ProfilerTask {
  public readonly title: string;
  public readonly startDate: Date;
  private readonly profiler: Profiler;

  public constructor(title: string, profiler: Profiler) {
    this.title = title;
    this.startDate = new Date();
    this.profiler = profiler;
  }

  public get elapsedTimeMs(): number {
    return Date.now() - this.startDate.getTime();
  }

  public finish(): void {
    this.profiler.finishTask(this);
  }
}
