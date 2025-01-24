import { D3Link } from "./D3Link.ts";
import * as d3 from "d3";

export class D3Calculator {
  public closestPointsOnNodes(d: D3Link) {
    const x1 = d.source.x;
    const y1 = d.source.y;
    const x2 = d.target.x;
    const y2 = d.target.y;

    if (d.isLoop) {
      const loopSizeRadius = Math.min(90, 360 / d.parallelCount / 2) / 2;
      const angle = (d.parallelIndex / d.parallelCount) * 360 - 90;
      const length = d.source.radius;
      const ps = this.vector(x1, y1, angle - loopSizeRadius, length);
      const pe = this.vector(x1, y1, angle + loopSizeRadius, length);

      return {
        x1: ps.x,
        y1: ps.y,
        x2: pe.x,
        y2: pe.y,
      };
    } else {
      const r1 = d.source.radius;
      const r2 = d.target.radius;

      // Vector from c1 to c2
      const dx = x2 - x1;
      const dy = y2 - y1;

      // Distance between the centers
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Normalize the vector to get the direction
      const ux = dx / distance;
      const uy = dy / distance;

      return {
        x1: x1 + r1 * ux,
        y1: y1 + r1 * uy,
        x2: x2 - r2 * ux,
        y2: y2 - r2 * uy,
      };
    }
  }

  public curvedPath(d: D3Link) {
    const control = this.curvePoints(d);
    const points: [number, number][] = control.points.map(
      (c): [number, number] => [c.x, c.y],
    );

    if (d.isLoop) {
      return d3.line().curve(d3.curveCardinal.tension(-5))(points);
    } else if (d.parallelCount > 0) {
      return d3.line().curve(d3.curveCatmullRom)(points);
    } else {
      return d3.line()(points);
    }
  }

  public vector(
    x1: number,
    y1: number,
    angle: number,
    length: number,
  ): { x: number; y: number } {
    const angleInRadians = angle * (Math.PI / 180);
    const rx = length * Math.cos(angleInRadians);
    const ry = length * Math.sin(angleInRadians);
    const p = {
      x: x1 + rx,
      y: y1 + ry,
    };
    return p;
  }

  public fixDegAngle(angle: number): number {
    return angle > 90 || angle < -90 ? angle - 180 : angle;
  }

  public pushVectorOfCurve(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    distance: number,
  ): { x: number; y: number } {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const orthX = y2 - y1;
    const orthY = -(x2 - x1);
    const orthLength = Math.sqrt(orthX * orthX + orthY * orthY);
    const dx = (orthX / orthLength) * distance;
    const dy = (orthY / orthLength) * distance;

    const controlX = midX + dx;
    const controlY = midY + dy;

    const p = {
      x: controlX,
      y: controlY,
    };
    return p;
  }

  public curvePoints(d: D3Link): {
    center: { x: number; y: number };
    angle: number;
    points: { x: number; y: number }[];
  } {
    const { x1, y1, x2, y2 } = this.closestPointsOnNodes(d);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    const curvAmount = 15;

    const p = this.pushVectorOfCurve(
      x1,
      y1,
      x2,
      y2,
      d.isLoop ? curvAmount * 4 : d.parallelIndex * curvAmount,
    );

    return {
      center: p,
      points: [{ x: x1, y: y1 }, p, { x: x2, y: y2 }],
      angle: this.fixDegAngle(angle),
    };
  }
}
