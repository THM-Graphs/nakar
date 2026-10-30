import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CanvasEvent } from './CanvasEvent';
import { CanvasChangedEvent } from './CanvasChangedEvent';
import { CanvasPresenceEvent } from './CanvasPresenceEvent';
import { CanvasProgressEvent } from './CanvasProgressEvent';
import { CanvasErrorEvent } from './CanvasErrorEvent';
import { CanvasPhysicsEvent } from './CanvasPhysicsEvent';
import { CanvasRoomEvent } from './CanvasRoomEvent';
import { CanvasLimitEvent } from './CanvasLimitEvent';
import { CanvasLifecycleEvent } from './CanvasLifecycleEvent';

const events: { name: string; event: CanvasEvent; type: string }[] = [
  {
    name: 'CanvasChangedEvent',
    event: new CanvasChangedEvent('canvas', ['graph']),
    type: 'changed',
  },
  {
    name: 'CanvasPresenceEvent',
    event: new CanvasPresenceEvent(
      'canvas',
      'joined',
      TestHarness.user().toData(),
    ),
    type: 'presence',
  },
  {
    name: 'CanvasProgressEvent',
    event: new CanvasProgressEvent('canvas', 'Loading', 1),
    type: 'progress',
  },
  {
    name: 'CanvasErrorEvent',
    event: new CanvasErrorEvent('canvas', new Error('test')),
    type: 'error',
  },
  {
    name: 'CanvasPhysicsEvent',
    event: new CanvasPhysicsEvent('canvas', {}, null),
    type: 'physics',
  },
  {
    name: 'CanvasRoomEvent',
    event: new CanvasRoomEvent('canvas', []),
    type: 'room',
  },
  {
    name: 'CanvasLimitEvent',
    event: new CanvasLimitEvent('canvas', 10),
    type: 'limit',
  },
  {
    name: 'CanvasLifecycleEvent',
    event: new CanvasLifecycleEvent('canvas', 'destroyed'),
    type: 'lifecycle',
  },
];

void describe('CanvasEvent', (): void => {
  void describe('constructor', (): void => {
    void it('provides a shared base for polymorphic delegate dispatch', (): void => {
      for (const entry of events) {
        assert.ok(entry.event instanceof CanvasEvent);
      }
    });
  });
});
