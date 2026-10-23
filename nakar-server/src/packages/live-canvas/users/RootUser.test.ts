import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RoomData } from '../data/RoomData';
import { MockStorageDelegate } from '../testing/MockStorageDelegate.test';
import { TestHarness } from '../testing/TestHarness.test';
import type { CanvasUser } from './CanvasUser';
import { RootUser } from './RootUser';

void describe('RootUser', (): void => {
  void describe('canEditProject', (): void => {
    void it('grants project editing without ownership or collaboration', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user('root').toData());
      assert.equal(actor.canEditProject(new MockStorageDelegate().room), true);
    });
    void it('grants project editing when no owner or collaborators are assigned', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user('root').toData());
      const room: RoomData = new MockStorageDelegate().room;
      room.ownerId = null;
      room.collaboratorIds = [];
      assert.equal(actor.canEditProject(room), true);
    });
    void it('grants project editing independently of the stored user identity', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user(null).toData());
      assert.equal(actor.canEditProject(new MockStorageDelegate().room), true);
    });
  });
  void describe('canUse', (): void => {
    void it('allows access to a private room without project membership', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user('root').toData());
      assert.equal(actor.canUse(new MockStorageDelegate().room), true);
    });
    void it('allows access to a public room', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user('root').toData());
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'public';
      assert.equal(actor.canUse(room), true);
    });
    void it('allows access to an unlisted room', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user('root').toData());
      const room: RoomData = new MockStorageDelegate().room;
      room.visibility = 'unlisted';
      assert.equal(actor.canUse(room), true);
    });
  });
  void describe('requireAccess', (): void => {
    void it('accepts room use without project membership', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user('root').toData());
      assert.doesNotThrow((): void => {
        actor.requireAccess(new MockStorageDelegate().room);
      });
    });
    void it('accepts project editing without project membership', (): void => {
      const actor: CanvasUser = new RootUser(TestHarness.user('root').toData());
      assert.doesNotThrow((): void => {
        actor.requireAccess(new MockStorageDelegate().room, true);
      });
    });
  });
});
