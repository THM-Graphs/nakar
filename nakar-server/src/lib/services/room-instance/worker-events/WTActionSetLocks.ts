export interface WTActionSetLocks {
  type: 'WTActionSetLocks';
  locks: Record<string, boolean>;
}
