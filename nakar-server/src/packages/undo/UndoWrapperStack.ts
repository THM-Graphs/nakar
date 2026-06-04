import { UndoWrapperStackEntry } from './UndoWrapperStackEntry';

export class UndoWrapperStack<T> {
  private _stack: UndoWrapperStackEntry<T>[];
  private readonly _size: number;

  public constructor(size: number) {
    this._stack = [];
    this._size = size;
  }

  public get size(): number {
    return this._stack.length;
  }

  public get peek(): UndoWrapperStackEntry<T> | null {
    if (this._stack.length === 0) {
      return null;
    }
    return this._stack[this._stack.length - 1];
  }

  public push(element: UndoWrapperStackEntry<T>): void {
    this._stack.push(element);
    this._trim();
  }

  public pop(): UndoWrapperStackEntry<T> {
    const element: UndoWrapperStackEntry<T> | undefined = this._stack.pop();
    if (element == null) {
      throw new Error('Unable to get element from stack.');
    }
    return element;
  }

  public clear(): void {
    this._stack = [];
  }

  private _trim(): void {
    if (this._stack.length > this._size) {
      this._stack.splice(0, this._stack.length - this._size);
    }
  }
}
