import { SchemaPhysicsPerformance } from '../../../../../src-gen/schema';

export interface WTEventPerformanceChanged {
  type: 'WTEventPerformanceChanged';
  performance: SchemaPhysicsPerformance | null;
}
