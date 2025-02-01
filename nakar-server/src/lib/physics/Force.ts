import { Vector } from './Vector';

export class Force {
  public static readonly maximumForce = 100;

  private readonly _value: Vector;

  public constructor(direction: Vector, length: number) {
    let normaliedLength = length;
    if (normaliedLength > Force.maximumForce) {
      normaliedLength = Force.maximumForce;
    }
    this._value = direction.normalized.multiplied(normaliedLength);
  }

  public get value(): Vector {
    return this._value;
  }

  public get inverted(): Force {
    return new Force(this._value, this.value.magnitude * -1);
  }

  public static twoBodyForce(
    massA: number,
    massB: number,
    positionA: Vector,
    positionB: Vector,
  ): Force {
    // https://de.wikipedia.org/wiki/Gravitationskonstante
    const direction = positionA.subtracted(positionB);
    const strength =
      ((massA * massB * 4) / Math.pow(direction.magnitude, 2)) * 0.00015;
    return new Force(direction, strength);
  }

  public static linkForce(
    targetLength: number,
    positionA: Vector,
    positionB: Vector,
  ): Force {
    const direction = positionA.subtracted(positionB);
    const strength = (targetLength - direction.magnitude) * 0.025;
    return new Force(direction, strength);
  }

  public static centerForce(position: Vector, mass: number): Force {
    return new Force(position.inverted, position.magnitude * mass * 0.00000013);
  }
}
