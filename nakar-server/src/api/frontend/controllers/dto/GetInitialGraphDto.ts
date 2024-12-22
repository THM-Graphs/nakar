import { GraphDto } from '../../../../lib/neo4j/GraphDto';

export class GetInitialGraphDto {
  constructor(public readonly graph: GraphDto) {}
}
