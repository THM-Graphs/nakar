export interface MockTimer {
  id: number;

  at: number;

  cancelled: boolean;

  callback(): void;
}
