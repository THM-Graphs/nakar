import { ProfilerService } from './ProfilerService';

export class ProfilerTask {
  private readonly _sender: unknown;
  private readonly _title: string;
  private readonly _startDate: number;
  private _endDate: number | null;
  private readonly _silent: boolean | null;

  private readonly _profiler: ProfilerService;

  public constructor(
    sender: unknown,
    title: string,
    profiler: ProfilerService,
    silent: boolean | null,
  ) {
    this._sender = sender;
    this._title = title;
    this._startDate = Date.now();
    this._endDate = null;
    this._profiler = profiler;
    this._silent = silent;
  }

  public get title(): string {
    return this._title;
  }

  public get isSilent(): boolean {
    return this._silent ?? false;
  }

  public get sender(): unknown {
    return this._sender;
  }

  public get elapsedTimeMs(): number {
    return (this._endDate ?? Date.now()) - this._startDate;
  }

  public finish(): void {
    this._endDate = Date.now();
    this._profiler.finishTask(this);
  }
}
