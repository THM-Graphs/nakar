import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidDataError } from '../error/InvalidDataError';
import { CanvasPhysicsConfiguration } from './CanvasPhysicsConfiguration';
import type { CanvasPhysicsOptions } from './CanvasPhysicsOptions';

void describe('CanvasPhysicsConfiguration', (): void => {
  void describe('constructor', (): void => {
    void it('uses the established defaults', (): void => {
      const configuration: CanvasPhysicsConfiguration =
        new CanvasPhysicsConfiguration();
      assert.equal(configuration.FPS, 16);
      assert.equal(configuration.maximumVelocity, 2000);
      assert.equal(configuration.maximumForce, 300);
      assert.equal(configuration.cooldownTime, 1000);
      assert.equal(configuration.frictionFactor, 0.4);
      assert.equal(configuration.targetPhysicsTickDuration, 15);
    });
    void it('copies all overrides independently of subsequent caller mutations', (): void => {
      const options: CanvasPhysicsOptions = {
        FPS: 30,
        maximumVelocity: 100,
        maximumForce: 50,
        cooldownTime: 200,
        frictionFactor: 0.2,
        targetPhysicsTickDuration: 10,
      };
      const configuration: CanvasPhysicsConfiguration =
        new CanvasPhysicsConfiguration(options);
      assert.equal(configuration.FPS, options.FPS);
      assert.equal(configuration.maximumVelocity, options.maximumVelocity);
      assert.equal(configuration.maximumForce, options.maximumForce);
      assert.equal(configuration.cooldownTime, options.cooldownTime);
      assert.equal(configuration.frictionFactor, options.frictionFactor);
      assert.equal(
        configuration.targetPhysicsTickDuration,
        options.targetPhysicsTickDuration,
      );
      options.FPS = 60;
      assert.equal(configuration.FPS, 30);
    });
    void it('rejects FPS of 0', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ FPS: 0 });
      }, InvalidDataError);
    });
    void it('rejects FPS of -1', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ FPS: -1 });
      }, InvalidDataError);
    });
    void it('rejects FPS of NaN', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ FPS: NaN });
      }, InvalidDataError);
    });
    void it('rejects FPS of Infinity', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ FPS: Infinity });
      }, InvalidDataError);
    });
    void it('rejects maximumVelocity of 0', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumVelocity: 0 });
      }, InvalidDataError);
    });
    void it('rejects maximumVelocity of -1', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumVelocity: -1 });
      }, InvalidDataError);
    });
    void it('rejects maximumVelocity of NaN', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumVelocity: NaN });
      }, InvalidDataError);
    });
    void it('rejects maximumVelocity of Infinity', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumVelocity: Infinity });
      }, InvalidDataError);
    });
    void it('rejects maximumForce of 0', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumForce: 0 });
      }, InvalidDataError);
    });
    void it('rejects maximumForce of -1', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumForce: -1 });
      }, InvalidDataError);
    });
    void it('rejects maximumForce of NaN', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumForce: NaN });
      }, InvalidDataError);
    });
    void it('rejects maximumForce of Infinity', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ maximumForce: Infinity });
      }, InvalidDataError);
    });
    void it('rejects cooldownTime of 0', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ cooldownTime: 0 });
      }, InvalidDataError);
    });
    void it('rejects cooldownTime of -1', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ cooldownTime: -1 });
      }, InvalidDataError);
    });
    void it('rejects cooldownTime of NaN', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ cooldownTime: NaN });
      }, InvalidDataError);
    });
    void it('rejects cooldownTime of Infinity', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ cooldownTime: Infinity });
      }, InvalidDataError);
    });
    void it('rejects targetPhysicsTickDuration of 0', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ targetPhysicsTickDuration: 0 });
      }, InvalidDataError);
    });
    void it('rejects targetPhysicsTickDuration of -1', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ targetPhysicsTickDuration: -1 });
      }, InvalidDataError);
    });
    void it('rejects targetPhysicsTickDuration of NaN', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ targetPhysicsTickDuration: NaN });
      }, InvalidDataError);
    });
    void it('rejects targetPhysicsTickDuration of Infinity', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ targetPhysicsTickDuration: Infinity });
      }, InvalidDataError);
    });
    void it('rejects friction of -0.1', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ frictionFactor: -0.1 });
      }, InvalidDataError);
    });
    void it('rejects friction of 1.1', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ frictionFactor: 1.1 });
      }, InvalidDataError);
    });
    void it('rejects friction of NaN', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ frictionFactor: NaN });
      }, InvalidDataError);
    });
    void it('rejects friction of Infinity', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsConfiguration({ frictionFactor: Infinity });
      }, InvalidDataError);
    });
    void it('accepts friction at the boundary 0', (): void => {
      assert.equal(
        new CanvasPhysicsConfiguration({ frictionFactor: 0 }).frictionFactor,
        0,
      );
    });
    void it('accepts friction at the boundary 1', (): void => {
      assert.equal(
        new CanvasPhysicsConfiguration({ frictionFactor: 1 }).frictionFactor,
        1,
      );
    });
  });
});
