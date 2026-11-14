import { ForbiddenError } from '../error/ForbiddenError';
import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CanvasUser } from './CanvasUser';
import { GuestCanvasUser } from './GuestCanvasUser';
import { AuthenticatedCanvasUser } from './AuthenticatedCanvasUser';

import { MockStorageDelegate } from '../testing/MockStorageDelegate.test';
import type { RoomData } from '../data/RoomData';
import type { UserData } from '../data/UserData';

void describe('CanvasUser', (): void => {
  void describe('constructor', (): void => {
    void it('references the supplied identity data', (): void => {
      const data: UserData = TestHarness.user().toData();
      const actor: CanvasUser = new AuthenticatedCanvasUser(data);
      data.username = 'changed';
      assert.equal(actor.toData().username, 'changed');
    });
  });
  void describe('canUse', (): void => {
    void it('checks guest in a public room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'public';
      assert.equal(TestHarness.user(null).canUse(room), true);
    });
    void it('checks unrelated in a public room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'public';
      assert.equal(TestHarness.user('unrelated').canUse(room), true);
    });
    void it('checks owner in a public room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'public';
      assert.equal(TestHarness.user('owner').canUse(room), true);
    });
    void it('checks collaborator in a public room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'public';
      assert.equal(TestHarness.user('collaborator').canUse(room), true);
    });
    void it('checks guest in a unlisted room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'unlisted';
      assert.equal(TestHarness.user(null).canUse(room), true);
    });
    void it('checks unrelated in a unlisted room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'unlisted';
      assert.equal(TestHarness.user('unrelated').canUse(room), true);
    });
    void it('checks owner in a unlisted room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'unlisted';
      assert.equal(TestHarness.user('owner').canUse(room), true);
    });
    void it('checks collaborator in a unlisted room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'unlisted';
      assert.equal(TestHarness.user('collaborator').canUse(room), true);
    });
    void it('checks guest in a private room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'private';
      assert.equal(TestHarness.user(null).canUse(room), false);
    });
    void it('checks unrelated in a private room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'private';
      assert.equal(TestHarness.user('unrelated').canUse(room), false);
    });
    void it('checks owner in a private room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'private';
      assert.equal(TestHarness.user('owner').canUse(room), true);
    });
    void it('checks collaborator in a private room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'private';
      assert.equal(TestHarness.user('collaborator').canUse(room), true);
    });
  });
  void describe('requireAccess', (): void => {
    void it('accepts a guest using a public room', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'public';
      assert.doesNotThrow((): void => {
        TestHarness.user(null).requireAccess(room);
      });
    });
    void it('rejects a guest using a private room', (): void => {
      assert.throws((): void => {
        TestHarness.user(null).requireAccess(new MockStorageDelegate().room);
      }, ForbiddenError);
    });
    void it('rejects project editing even when room use is public', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'public';
      assert.throws((): void => {
        TestHarness.user('unrelated').requireAccess(room, true);
      }, ForbiddenError);
    });
    void it('accepts project editing by a collaborator', (): void => {
      assert.doesNotThrow((): void => {
        TestHarness.user('collaborator').requireAccess(
          new MockStorageDelegate().room,
          true,
        );
      });
    });
  });
  void describe('toData', (): void => {
    void it('detaches nested cursor and identity data', (): void => {
      const data: UserData = TestHarness.user().toData();
      data.position = { x: 1, y: 2 };
      const actor: CanvasUser = new AuthenticatedCanvasUser(data);
      const snapshot: UserData = actor.toData();
      assert.ok(snapshot.position);
      snapshot.position.x = 9;
      snapshot.username = 'changed';
      assert.equal(data.position.x, 1);
      assert.notEqual(data.username, 'changed');
    });
  });
  void describe('canEditProject', (): void => {
    void it('dispatches permissions through concrete user types', (): void => {
      const room: RoomData = new MockStorageDelegate().room;
      const guest: CanvasUser = new GuestCanvasUser(
        TestHarness.user(null).toData(),
      );
      const owner: CanvasUser = new AuthenticatedCanvasUser(
        TestHarness.user().toData(),
      );
      assert.equal(guest.canEditProject(room), false);
      assert.equal(owner.canEditProject(room), true);
    });
  });
});
