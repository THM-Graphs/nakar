import { ProfilerService } from './ProfilerService';

export class ProfilerTask {
  public readonly title: string;
  public readonly startDate: Date;

  private readonly _profiler: ProfilerService;

  public constructor(title: string, profiler: ProfilerService) {
    this.title = title;
    this.startDate = new Date();
    this._profiler = profiler;
  }

  public get elapsedTimeMs(): number {
    return Date.now() - this.startDate.getTime();
  }

  public finish(): void {
    this._profiler.finishTask(this);
  }
}
