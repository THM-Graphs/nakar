import { ProfilerTask } from './ProfilerTask';

export class Profiler {
  public static readonly shared: Profiler = new Profiler();

  public readonly timeoutMs: number;
  private readonly tasks: ProfilerTask[];

  public constructor(timeoutMs = 60_000) {
    this.tasks = [];
    this.timeoutMs = timeoutMs;
  }

  public profile(title: string): ProfilerTask {
    this.checkTimeoutTasks();
    const task = new ProfilerTask(title, this);
    this.tasks.push(task);
    return task;
  }

  public finishTask(task: ProfilerTask): void {
    this.checkTimeoutTasks();
    if (!this.tasks.includes(task)) {
      strapi.log.error(`Profiler task ${task.title} not found.`);
    }
    strapi.log.debug(
      `[PROFILER] ${task.title}: ${task.elapsedTimeMs.toString()}ms`,
    );
    this.removeTask(task);
  }

  private removeTask(task: ProfilerTask): void {
    const index = this.tasks.indexOf(task);
    if (index !== -1) {
      this.tasks.splice(index, 1);
    }
  }

  private checkTimeoutTasks(): void {
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      if (task.elapsedTimeMs > this.timeoutMs) {
        strapi.log.warn(
          `Task ${task.title} did time out (after ${this.timeoutMs.toString()}ms).`,
        );
        this.tasks.splice(i, 1); // Remove the element
        i--;
      }
    }
  }
}
