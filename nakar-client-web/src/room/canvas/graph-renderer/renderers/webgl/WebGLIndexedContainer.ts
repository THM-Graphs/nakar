import { Container, ContainerChild } from "pixi.js";

/** Wraps a Pixi container and keeps its children indexed by ID. */
export abstract class WebGLIndexedContainer<
  T extends ContainerChild & { readonly id: string },
> {
  private readonly _container: Container<T>;
  private readonly _index = new Map<string, T>();

  protected constructor(label: string) {
    this._container = new Container<T>({ label });
    this._container.on("childAdded", (child) => {
      this._index.set(child.id, child);
    });
    this._container.on("childRemoved", (child) => {
      if (this._index.get(child.id) === child) {
        this._index.delete(child.id);
      }
    });
    this._container.on("destroyed", () => {
      this._index.clear();
    });
  }

  public get container(): Container<T> {
    return this._container;
  }

  public get children(): readonly T[] {
    return this._container.children;
  }

  public add(child: T): T {
    return this._container.addChild(child);
  }

  public remove(child: T): T {
    return this._container.removeChild(child);
  }

  public clear(): T[] {
    return this._container.removeChildren();
  }

  public getById(id: string): T | null {
    return this._index.get(id) ?? null;
  }
}
