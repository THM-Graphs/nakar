import { WebGLGraphRendererSystem } from "./WebGLGraphRendererSystem.ts";
import { Application } from "pixi.js";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";

export class WebGLGraphRendererSystemFactory {
  private _destroyed: boolean;

  public constructor() {
    this._destroyed = false;
  }

  public async createInstance(
    _colorSchema: ColorSchema,
    _theme: Theme,
  ): Promise<WebGLGraphRendererSystem | null> {
    const app = new Application();

    await app.init({
      resizeTo: window,
      antialias: true,
      backgroundAlpha: 0,
      autoDensity: true,
      hello: true,
      resolution: 2,
    });

    if (this._destroyed) {
      app.destroy(true, true);
      return null;
    }

    return new WebGLGraphRendererSystem(app, _colorSchema, _theme);
  }

  public destory(): void {
    this._destroyed = true;
  }
}
