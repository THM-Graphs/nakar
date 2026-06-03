import { TaskQueueTask } from './TaskQueueTask';
import { Observable, Subject } from 'rxjs';
import { TaskQueueState } from './TaskQueueState';

export class TaskQueue {
  private _queue: TaskQueueTask[];
  private _currentTask: TaskQueueTask | null;
  private readonly _onLog: Subject<string>;
  private readonly _onUpdate: Subject<TaskQueueState>;
  private readonly _onError: Subject<unknown>;

  public constructor() {
    this._queue = [];
    this._currentTask = null;
    this._onLog = new Subject();
    this._onUpdate = new Subject();
    this._onError = new Subject();
  }

  public get onLog(): Observable<string> {
    return this._onLog.asObservable();
  }

  public get onUpdate$(): Observable<TaskQueueState> {
    return this._onUpdate.asObservable();
  }

  public get onError$(): Observable<unknown> {
    return this._onError.asObservable();
  }

  public addTask(task: TaskQueueTask): void {
    this._queue.push(task);
    this._check();
  }

  public shutdown(): void {
    this._queue = [];
  }

  private _check(): void {
    this._propagateUpdate();

    if (this._currentTask != null) {
      return;
    }
    if (this._queue.length === 0) {
      return;
    }

    void (async (): Promise<void> => {
      const newTask: TaskQueueTask = this._queue[0];
      this._queue.splice(0, 1);
      this._currentTask = newTask;

      this._onLog.next(`Will start task: '${newTask.title}'.`);
      this._propagateUpdate();

      try {
        await this._enqueueEventLoop();
        await newTask.action();
        this._onLog.next(`Task '${newTask.title}' did finish successfully.`);
      } catch (error) {
        this._onLog.next(
          `Task '${newTask.title}' did error: ${JSON.stringify(error)}`,
        );
        this._onError.next(error);
      }

      this._currentTask = null;

      this._check();
    })();
  }

  private _propagateUpdate(): void {
    this._onUpdate.next({
      pending: this._queue.map((task: TaskQueueTask): string => task.title),
      active: this._currentTask?.title ?? null,
    });
  }

  private async _enqueueEventLoop(): Promise<void> {
    await new Promise<void>((resolve: () => void): void => {
      setImmediate((): void => {
        resolve();
      });
    });
  }
}
