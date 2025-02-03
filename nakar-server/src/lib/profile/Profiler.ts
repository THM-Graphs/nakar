import { ProfilerTask } from './ProfilerTask';

export class Profiler {
  public static readonly shared: Profiler = new Profiler();

  public readonly timeoutMs: number;

  private readonly _tasks: ProfilerTask[];

  public constructor(timeoutMs: number = 60_000) {
    this._tasks = [];
    this.timeoutMs = timeoutMs;
  }

  public profile(title: string): ProfilerTask {
    this._checkTimeoutTasks();
    const task = new ProfilerTask(title, this);
    this._tasks.push(task);
    return task;
  }

  public finishTask(task: ProfilerTask): void {
    this._checkTimeoutTasks();
    if (!this._tasks.includes(task)) {
      strapi.log.error(`Profiler task ${task.title} not found.`);
    }
    strapi.log.debug(
      `[PROFILER] ${task.title}: ${task.elapsedTimeMs.toString()}ms`,
    );
    this._removeTask(task);
  }

  private _removeTask(task: ProfilerTask): void {
    const index = this._tasks.indexOf(task);
    if (index !== -1) {
      this._tasks.splice(index, 1);
    }
  }

  private _checkTimeoutTasks(): void {
    for (let i = 0; i < this._tasks.length; i++) {
      const task = this._tasks[i];
      if (task.elapsedTimeMs > this.timeoutMs) {
        strapi.log.warn(
          `Task ${task.title} did time out (after ${this.timeoutMs.toString()}ms).`,
        );
        this._tasks.splice(i, 1); // Remove the element
        i--;
      }
    }
  }
}
