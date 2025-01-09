import { SchemaGetInitialGraph } from '../../../../src-gen/schema';
import { GraphDisplayConfiguration } from './GraphDisplayConfiguration';

export type Transformer = (
  graph: SchemaGetInitialGraph,
  displayConfiguration: GraphDisplayConfiguration,
) => SchemaGetInitialGraph | Promise<SchemaGetInitialGraph>;
