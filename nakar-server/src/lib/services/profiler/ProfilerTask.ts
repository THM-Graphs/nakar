import { ProfilerService } from './ProfilerService';

export class ProfilerTask {
  public readonly sender: unknown;
  public readonly title: string;
  public readonly startDate: Date;

  private readonly _profiler: ProfilerService;

  public constructor(
    sender: unknown,
    title: string,
    profiler: ProfilerService,
  ) {
    this.sender = sender;
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
