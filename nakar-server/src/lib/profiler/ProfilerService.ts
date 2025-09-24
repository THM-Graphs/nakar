import { ProfilerTask } from './ProfilerTask';
import type { LoggerService } from '../logger/LoggerService';
import type { ApplicationService } from '../application/ApplicationService';

export class ProfilerService implements ApplicationService {
  public readonly timeoutMs: number;

  private readonly _tasks: ProfilerTask[];

  public constructor(
    private readonly _logger: LoggerService,
    timeoutMs: number = 99_000,
  ) {
    this._tasks = [];
    this.timeoutMs = timeoutMs;
  }

  public bootstrap(): void | Promise<void> {
    /* */
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public profile(
    sender: unknown,
    title: string,
    silent?: boolean,
  ): ProfilerTask {
    this._checkTimeoutTasks();
    const task: ProfilerTask = new ProfilerTask(
      sender,
      title,
      this,
      silent ?? null,
    );
    this._tasks.push(task);
    // if (!task.isSilent) {
    //   this._logger.debug(task.sender, `🛫 Start: ${title}`);
    // }
    return task;
  }

  public finishTask(task: ProfilerTask): void {
    this._checkTimeoutTasks();
    if (!this._tasks.includes(task)) {
      this._logger.error(this, `Profiler task ${task.title} not found.`);
    }
    if (!task.isSilent) {
      this._logger.debug(
        task.sender,
        `${task.title} (${task.elapsedTimeMs.toFixed(0)}ms)`,
      );
    }
    this._removeTask(task);
  }

  private _removeTask(task: ProfilerTask): void {
    const index: number = this._tasks.indexOf(task);
    if (index !== -1) {
      this._tasks.splice(index, 1);
    }
  }

  private _checkTimeoutTasks(): void {
    for (let i: number = 0; i < this._tasks.length; i++) {
      const task: ProfilerTask = this._tasks[i];
      if (task.elapsedTimeMs > this.timeoutMs) {
        this._logger.warn(
          task.sender,
          `Task ${task.title} did time out (after ${this.timeoutMs.toString()}ms).`,
        );
        this._tasks.splice(i, 1); // Remove the element
        i--;
      }
    }
  }
}
