export interface ApplicationService {
  bootstrap(): Promise<void> | void;
  destroy(): Promise<void> | void;
}
