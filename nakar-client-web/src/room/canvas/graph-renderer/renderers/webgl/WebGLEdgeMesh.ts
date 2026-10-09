import { DestroyOptions, Mesh, MeshGeometry, PointData } from "pixi.js";

export class WebGLEdgeMesh extends Mesh {
  private readonly _lastNodeGeometry = new Float64Array(6);
  private _geometryInitialized = false;

  public constructor(private readonly _segments: number) {
    const positions = new Float32Array((_segments + 1) * 4);
    const indices = new Uint32Array(_segments * 6);
    for (let i = 0; i < _segments; i++) {
      const vertex = i * 2;
      indices.set(
        [vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2],
        i * 6,
      );
    }
    super({ geometry: new MeshGeometry({ positions, indices }) });
    this.geometry.batchMode = "batch";
    this.eventMode = "dynamic";
    this.cursor = "pointer";
  }

  public updateNodeGeometry(
    start: PointData,
    end: PointData,
    startRadius: number,
    endRadius: number,
  ): boolean {
    const previous = this._lastNodeGeometry;
    if (
      this._geometryInitialized &&
      previous[0] === start.x &&
      previous[1] === start.y &&
      previous[2] === end.x &&
      previous[3] === end.y &&
      previous[4] === startRadius &&
      previous[5] === endRadius
    ) {
      return false;
    }
    previous[0] = start.x;
    previous[1] = start.y;
    previous[2] = end.x;
    previous[3] = end.y;
    previous[4] = startRadius;
    previous[5] = endRadius;
    this._geometryInitialized = true;
    return true;
  }

  public updateCurve(
    start: PointData,
    control: PointData,
    end: PointData,
    width: number,
  ): void {
    const positions = this.geometry.positions;
    const halfWidth = width / 2;
    for (let i = 0; i <= this._segments; i++) {
      const t = i / this._segments;
      const u = 1 - t;
      let x = u * u * start.x + 2 * u * t * control.x + t * t * end.x;
      let y = u * u * start.y + 2 * u * t * control.y + t * t * end.y;
      let dx = u * (control.x - start.x) + t * (end.x - control.x);
      let dy = u * (control.y - start.y) + t * (end.y - control.y);
      let length = Math.hypot(dx, dy);
      if (length === 0) {
        dx = end.x - start.x;
        dy = end.y - start.y;
        length = Math.hypot(dx, dy);
        if (length === 0) {
          dx = 1;
          length = 1;
        }
      }
      dx /= length;
      dy /= length;

      const cap = i === 0 ? -halfWidth : i === this._segments ? halfWidth : 0;
      x += dx * cap;
      y += dy * cap;
      const nx = -dy * halfWidth;
      const ny = dx * halfWidth;
      const offset = i * 4;
      positions[offset] = x + nx;
      positions[offset + 1] = y + ny;
      positions[offset + 2] = x - nx;
      positions[offset + 3] = y - ny;
    }
    this.geometry.getBuffer("aPosition").update();
  }

  public override destroy(options?: DestroyOptions): void {
    if (this.destroyed) {
      return;
    }
    const geometry = this.geometry;
    super.destroy(options);
    geometry.destroy(true);
  }
}
