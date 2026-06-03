import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskQueue } from './TaskQueue';
import { TaskQueueTask } from './TaskQueueTask';
import { TaskQueueState } from './TaskQueueState';

interface Deferred {
  promise: Promise<void>;
  resolve(): void;
}

const createDeferred = (): Deferred => {
  let resolveFn: (() => void) | null = null;
  const promise: Promise<void> = new Promise<void>(
    (resolve: () => void): void => {
      resolveFn = resolve;
    },
  );
  return {
    promise: promise,
    resolve: (): void => {
      resolveFn?.();
    },
  };
};

const waitUntil = async (
  condition: () => boolean,
  timeoutMs: number = 1000,
): Promise<void> => {
  const deadline: number = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) {
      assert.fail('Timed out while waiting for async queue state.');
    }
    await new Promise<void>((resolve: () => void): void => {
      setTimeout(resolve, 0);
    });
  }
};

void test('runs tasks sequentially and emits state updates', async (): Promise<void> => {
  const queue: TaskQueue = new TaskQueue();
  const updates: TaskQueueState[] = [];
  const execution: string[] = [];

  queue.onUpdate$.subscribe((state: TaskQueueState): void => {
    updates.push(state);
  });

  const firstTaskDone: Deferred = createDeferred();

  queue.addTask(
    new TaskQueueTask('first', async (): Promise<void> => {
      execution.push('first:start');
      await firstTaskDone.promise;
      execution.push('first:end');
    }),
  );
  queue.addTask(
    new TaskQueueTask('second', (): void => {
      execution.push('second:run');
    }),
  );

  await waitUntil((): boolean => {
    return execution.includes('first:start');
  });
  assert.deepEqual(execution, ['first:start']);

  firstTaskDone.resolve();

  await waitUntil((): boolean => {
    return execution.includes('second:run');
  });

  assert.deepEqual(execution, ['first:start', 'first:end', 'second:run']);
  assert.deepEqual(updates, [
    { pending: ['first'], active: null },
    { pending: [], active: 'first' },
    { pending: ['second'], active: 'first' },
    { pending: ['second'], active: null },
    { pending: [], active: 'second' },
    { pending: [], active: null },
  ]);
});

void test('publishes task errors and continues with remaining tasks', async (): Promise<void> => {
  const queue: TaskQueue = new TaskQueue();
  const errors: unknown[] = [];
  const execution: string[] = [];
  const error: Error = new Error('boom');

  queue.onError$.subscribe((input: unknown): void => {
    errors.push(input);
  });

  queue.addTask(
    new TaskQueueTask('failing', (): void => {
      execution.push('failing:run');
      throw error;
    }),
  );
  queue.addTask(
    new TaskQueueTask('next', (): void => {
      execution.push('next:run');
    }),
  );

  await waitUntil((): boolean => {
    return execution.includes('next:run');
  });

  assert.deepEqual(execution, ['failing:run', 'next:run']);
  assert.equal(errors.length, 1);
  assert.equal(errors[0], error);
});

void test('shutdown clears pending queue entries', async (): Promise<void> => {
  const queue: TaskQueue = new TaskQueue();
  const execution: string[] = [];
  const firstTaskDone: Deferred = createDeferred();

  queue.addTask(
    new TaskQueueTask('first', async (): Promise<void> => {
      execution.push('first:start');
      await firstTaskDone.promise;
      execution.push('first:end');
    }),
  );
  queue.addTask(
    new TaskQueueTask('second', (): void => {
      execution.push('second:run');
    }),
  );

  await waitUntil((): boolean => {
    return execution.includes('first:start');
  });

  queue.shutdown();
  firstTaskDone.resolve();

  await waitUntil((): boolean => {
    return execution.includes('first:end');
  });
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 10);
  });

  assert.deepEqual(execution, ['first:start', 'first:end']);
});
