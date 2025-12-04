import type { WTEventPhysicsUpdate } from './WTEventPhysicsUpdate';
import { WTEventPhysicsStopped } from './WTEventPhysicsStopped';

export type WTEvent = WTEventPhysicsUpdate | WTEventPhysicsStopped;
