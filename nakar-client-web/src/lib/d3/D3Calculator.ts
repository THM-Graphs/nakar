import { D3Link } from "./D3Link.ts";
import * as d3 from "d3";
import { D3Node } from "./D3Node.ts";

export class D3Calculator {
  public closestPointsOnNodes(d: D3Link) {
    if (d.isLoop) {
      const loopSizeRadius = Math.min(90, 360 / d.parallelCount / 2) / 2;
      const angle = (d.parallelIndex / d.parallelCount) * 360 - 90;
      const length = d.source.radius;
      const ps = this.vector(
        d.source.x,
        d.source.y,
        angle - loopSizeRadius,
        length,
      );
      const pe = this.vector(
        d.source.x,
        d.source.y,
        angle + loopSizeRadius,
        length,
      );

      return {
        x1: ps.x,
        y1: ps.y,
        x2: pe.x,
        y2: pe.y,
      };
    } else {
      const point1 = this.pointOnRadius(d.source, {
        x: d.target.x,
        y: d.target.y,
      });
      const point2 = this.pointOnRadius(d.target, {
        x: d.source.x,
        y: d.source.y,
      });

      return {
        x1: point1.x,
        y1: point1.y,
        x2: point2.x,
        y2: point2.y,
      };
    }
  }

  public pointOnRadius(
    node: D3Node,
    point: { x: number; y: number },
  ): { x: number; y: number } {
    // Vector from c1 to c2
    const dx = point.x - node.x;
    const dy = point.y - node.y;

    // Distance between the centers
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize the vector to get the direction
    const ux = dx / distance;
    const uy = dy / distance;

    return {
      x: node.x + node.radius * ux,
      y: node.y + node.radius * uy,
    };
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
    n1: D3Node,
    x2: number,
    y2: number,
    n2: D3Node,
    distance: number,
    moveEnds: boolean,
  ): { x: number; y: number }[] {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const orthX = y2 - y1;
    const orthY = -(x2 - x1);
    const orthLength = Math.sqrt(orthX * orthX + orthY * orthY);
    const dx = (orthX / orthLength) * distance;
    const dy = (orthY / orthLength) * distance;

    const controlX = midX + dx;
    const controlY = midY + dy;

    const center = {
      x: controlX,
      y: controlY,
    };
    return [
      moveEnds ? this.pointOnRadius(n1, center) : { x: x1, y: y1 },
      center,
      moveEnds ? this.pointOnRadius(n2, center) : { x: x2, y: y2 },
    ];
  }

  public curvePoints(d: D3Link): {
    center: { x: number; y: number };
    angle: number;
    points: { x: number; y: number }[];
  } {
    const { x1, y1, x2, y2 } = this.closestPointsOnNodes(d);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    const curvAmount = 15;

    const newPoints = this.pushVectorOfCurve(
      x1,
      y1,
      d.source,
      x2,
      y2,
      d.target,
      d.isLoop ? curvAmount + d.source.radius : d.parallelIndex * curvAmount,
      !d.isLoop,
    );

    return {
      center: newPoints[1],
      points: newPoints,
      angle: this.fixDegAngle(angle),
    };
  }
}
