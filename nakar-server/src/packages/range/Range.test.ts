import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Range } from './Range';

void describe('Range', (): void => {
  void describe('constructor', (): void => {
    void it('throws for floor greater than ceiling', (): void => {
      // when
      let error: unknown;
      try {
        new Range({ floor: 2, ceiling: 1 });
      } catch (caught: unknown) {
        error = caught;
      }

      // then
      assert.ok(error instanceof Error);
      assert.match(
        error.message,
        /Cannot create Range with floor 2 and ceiling 1\./,
      );
    });

    void it('sets floor and ceiling values', (): void => {
      // when
      const range: Range = new Range({ floor: 1, ceiling: 4 });

      // then
      assert.equal(range.floor, 1);
      assert.equal(range.ceiling, 4);
    });
  });

  void describe('delta', (): void => {
    void it('returns difference between ceiling and floor', (): void => {
      // given
      const range: Range = new Range({ floor: 1, ceiling: 4 });

      // when
      const actual: number = range.delta;

      // then
      assert.equal(actual, 3);
    });
  });

  void describe('clamp', (): void => {
    void describe('static', (): void => {
      void it('returns minimum for values below range', (): void => {
        // when
        const actual: number = Range.clamp(5, 10, 20);

        // then
        assert.equal(actual, 10);
      });

      void it('returns maximum for values above range', (): void => {
        // when
        const actual: number = Range.clamp(25, 10, 20);

        // then
        assert.equal(actual, 20);
      });

      void it('returns value for values inside range', (): void => {
        // when
        const actual: number = Range.clamp(15, 10, 20);

        // then
        assert.equal(actual, 15);
      });
    });

    void describe('instance', (): void => {
      void it('uses range bounds for lower overflow', (): void => {
        // given
        const range: Range = new Range({ floor: 10, ceiling: 20 });

        // when
        const actual: number = range.clamp(9);

        // then
        assert.equal(actual, 10);
      });

      void it('uses range bounds for upper overflow', (): void => {
        // given
        const range: Range = new Range({ floor: 10, ceiling: 20 });

        // when
        const actual: number = range.clamp(21);

        // then
        assert.equal(actual, 20);
      });

      void it('returns value inside bounds unchanged', (): void => {
        // given
        const range: Range = new Range({ floor: 10, ceiling: 20 });

        // when
        const actual: number = range.clamp(12);

        // then
        assert.equal(actual, 12);
      });
    });
  });

  void describe('one', (): void => {
    void it('creates a single-point range at one', (): void => {
      // when
      const one: Range = Range.one();

      // then
      assert.equal(one.floor, 1);
      assert.equal(one.ceiling, 1);
    });
  });

  void describe('scaleValueLinear', (): void => {
    void it('maps value proportionally for non-zero delta', (): void => {
      // given
      const from: Range = new Range({ floor: 0, ceiling: 10 });
      const to: Range = new Range({ floor: 0, ceiling: 100 });

      // when
      const actual: number = from.scaleValueLinear(to, 2);

      // then
      assert.equal(actual, 20);
    });

    void it('returns target floor when source delta is zero', (): void => {
      // given
      const source: Range = new Range({ floor: 5, ceiling: 5 });
      const to: Range = new Range({ floor: 0, ceiling: 100 });

      // when
      const actual: number = source.scaleValueLinear(to, 99);

      // then
      assert.equal(actual, 0);
    });
  });

  void describe('positionOfValueInPercent', (): void => {
    void it('returns relative position', (): void => {
      // given
      const from: Range = new Range({ floor: 0, ceiling: 10 });

      // when
      const actual: number = from.positionOfValueInPercent(2.5);

      // then
      assert.equal(actual, 0.25);
    });
  });

  void describe('scaled', (): void => {
    void it('transforms floor using scaler', (): void => {
      // given
      const source: Range = new Range({ floor: 2, ceiling: 4 });

      // when
      const scaled: Range = source.scaled((value: number): number => {
        return value * 3;
      });

      // then
      assert.equal(scaled.floor, 6);
    });

    void it('transforms ceiling using scaler', (): void => {
      // given
      const source: Range = new Range({ floor: 2, ceiling: 4 });

      // when
      const scaled: Range = source.scaled((value: number): number => {
        return value * 3;
      });

      // then
      assert.equal(scaled.ceiling, 12);
    });

    void it('keeps derived delta consistent after scaling', (): void => {
      // given
      const source: Range = new Range({ floor: 2, ceiling: 4 });

      // when
      const scaled: Range = source.scaled((value: number): number => {
        return value * 3;
      });

      // then
      assert.equal(scaled.delta, 6);
    });

    void it('creates a new range instance', (): void => {
      // given
      const source: Range = new Range({ floor: 2, ceiling: 4 });

      // when
      const scaled: Range = source.scaled((value: number): number => {
        return value;
      });

      // then
      assert.notEqual(scaled, source);
    });
  });

  void describe('scaleValue', (): void => {
    void it('supports linear mode', (): void => {
      // given
      const from: Range = new Range({ floor: 0, ceiling: 10 });
      const to: Range = new Range({ floor: 0, ceiling: 100 });

      // when
      const actual: number = from.scaleValue(to, 2, 'linear');

      // then
      assert.equal(actual, 20);
    });

    void it('supports log10 mode', (): void => {
      // given
      const from: Range = new Range({ floor: 1, ceiling: 100 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });

      // when
      const actual: number = from.scaleValue(to, 10, 'log10');

      // then
      assert.equal(actual, 0.5);
    });

    void it('supports log2 mode', (): void => {
      // given
      const from: Range = new Range({ floor: 1, ceiling: 8 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });

      // when
      const actual: number = from.scaleValue(to, 2, 'log2');

      // then
      assert.equal(actual, 1 / 3);
    });

    void it('supports natural logarithm mode', (): void => {
      // given
      const from: Range = new Range({ floor: 1, ceiling: Math.E ** 2 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });

      // when
      const actual: number = from.scaleValue(to, Math.E, 'logn');

      // then
      assert.equal(actual, 0.5);
    });

    void it('handles zero without applying logarithm', (): void => {
      // given
      const from: Range = new Range({ floor: 0, ceiling: 100 });
      const to: Range = new Range({ floor: 0, ceiling: 1 });

      // when
      const actual: number = from.scaleValue(to, 0, 'log10');

      // then
      assert.equal(actual, 0);
    });
  });
});
