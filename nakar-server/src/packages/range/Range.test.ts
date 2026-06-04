import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Range } from './Range';

void describe('Range', (): void => {
  void describe('constructor', (): void => {
    void it('throws for floor greater than ceiling', (): void => {
      assert.throws((): Range => {
        return new Range({ floor: 2, ceiling: 1 });
      }, /Cannot create Range with floor 2 and ceiling 1\./);
    });

    void it('sets floor and ceiling values', (): void => {
      const range: Range = new Range({ floor: 1, ceiling: 4 });
      assert.equal(range.floor, 1);
      assert.equal(range.ceiling, 4);
    });
  });

  void describe('delta', (): void => {
    void it('returns difference between ceiling and floor', (): void => {
      const range: Range = new Range({ floor: 1, ceiling: 4 });
      assert.equal(range.delta, 3);
    });
  });

  void describe('clamp', (): void => {
    void describe('static', (): void => {
      void it('returns minimum for values below range', (): void => {
        assert.equal(Range.clamp(5, 10, 20), 10);
      });

      void it('returns maximum for values above range', (): void => {
        assert.equal(Range.clamp(25, 10, 20), 20);
      });

      void it('returns value for values inside range', (): void => {
        assert.equal(Range.clamp(15, 10, 20), 15);
      });
    });

    void describe('instance', (): void => {
      void it('uses range bounds for lower overflow', (): void => {
        const range: Range = new Range({ floor: 10, ceiling: 20 });
        assert.equal(range.clamp(9), 10);
      });

      void it('uses range bounds for upper overflow', (): void => {
        const range: Range = new Range({ floor: 10, ceiling: 20 });
        assert.equal(range.clamp(21), 20);
      });

      void it('returns value inside bounds unchanged', (): void => {
        const range: Range = new Range({ floor: 10, ceiling: 20 });
        assert.equal(range.clamp(12), 12);
      });
    });
  });

  void describe('one', (): void => {
    void it('creates a single-point range at one', (): void => {
      const one: Range = Range.one();
      assert.equal(one.floor, 1);
      assert.equal(one.ceiling, 1);
    });
  });

  void describe('scaleValueLinear', (): void => {
    void it('maps value proportionally for non-zero delta', (): void => {
      const from: Range = new Range({ floor: 0, ceiling: 10 });
      const to: Range = new Range({ floor: 0, ceiling: 100 });
      assert.equal(from.scaleValueLinear(to, 2), 20);
    });

    void it('returns target floor when source delta is zero', (): void => {
      const source: Range = new Range({ floor: 5, ceiling: 5 });
      const to: Range = new Range({ floor: 0, ceiling: 100 });
      assert.equal(source.scaleValueLinear(to, 99), 0);
    });
  });

  void describe('positionOfValueInPercent', (): void => {
    void it('returns relative position', (): void => {
      const from: Range = new Range({ floor: 0, ceiling: 10 });
      assert.equal(from.positionOfValueInPercent(2.5), 0.25);
    });
  });

  void describe('scaled', (): void => {
    void it('transforms floor using scaler', (): void => {
      const source: Range = new Range({ floor: 2, ceiling: 4 });
      const scaled: Range = source.scaled((value: number): number => {
        return value * 3;
      });
      assert.equal(scaled.floor, 6);
    });

    void it('transforms ceiling using scaler', (): void => {
      const source: Range = new Range({ floor: 2, ceiling: 4 });
      const scaled: Range = source.scaled((value: number): number => {
        return value * 3;
      });
      assert.equal(scaled.ceiling, 12);
    });

    void it('keeps derived delta consistent after scaling', (): void => {
      const source: Range = new Range({ floor: 2, ceiling: 4 });
      const scaled: Range = source.scaled((value: number): number => {
        return value * 3;
      });
      assert.equal(scaled.delta, 6);
    });

    void it('creates a new range instance', (): void => {
      const source: Range = new Range({ floor: 2, ceiling: 4 });
      const scaled: Range = source.scaled((value: number): number => {
        return value;
      });
      assert.notEqual(scaled, source);
    });
  });

  void describe('scaleValue', (): void => {
    void it('supports linear mode', (): void => {
      const from: Range = new Range({ floor: 0, ceiling: 10 });
      const to: Range = new Range({ floor: 0, ceiling: 100 });
      assert.equal(from.scaleValue(to, 2, 'linear'), 20);
    });

    void it('supports log10 mode', (): void => {
      const from: Range = new Range({ floor: 1, ceiling: 100 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });
      assert.equal(from.scaleValue(to, 10, 'log10'), 0.5);
    });

    void it('supports log2 mode', (): void => {
      const from: Range = new Range({ floor: 1, ceiling: 8 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });
      assert.equal(from.scaleValue(to, 2, 'log2'), 1 / 3);
    });

    void it('supports natural logarithm mode', (): void => {
      const from: Range = new Range({ floor: 1, ceiling: Math.E ** 2 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });
      assert.equal(from.scaleValue(to, Math.E, 'logn'), 0.5);
    });

    void it('handles zero without applying logarithm', (): void => {
      const from: Range = new Range({ floor: 0, ceiling: 100 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });
      assert.equal(from.scaleValue(to, 0, 'log10'), 0);
    });
  });
});
