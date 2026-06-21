import type { WTEventPhysicsUpdate } from './WTEventPhysicsUpdate';
import type { WTEventPhysicsStopped } from './WTEventPhysicsStopped';

export type WTEvent = WTEventPhysicsUpdate | WTEventPhysicsStopped;
