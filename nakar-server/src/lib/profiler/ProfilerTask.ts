import { ProfilerService } from './ProfilerService';

export class ProfilerTask {
  private readonly _sender: unknown;
  private readonly _title: string;
  private readonly _startDate: number;
  private _endDate: number | null;

  private readonly _profiler: ProfilerService;

  public constructor(
    sender: unknown,
    title: string,
    profiler: ProfilerService,
  ) {
    this._sender = sender;
    this._title = title;
    this._startDate = performance.now();
    this._endDate = null;
    this._profiler = profiler;
  }

  public get title(): string {
    return this._title;
  }

  public get sender(): unknown {
    return this._sender;
  }

  public get elapsedTimeMs(): number {
    return (this._endDate ?? performance.now()) - this._startDate;
  }

  public finish(): void {
    this._endDate = performance.now();
    this._profiler.finishTask(this);
  }
}
