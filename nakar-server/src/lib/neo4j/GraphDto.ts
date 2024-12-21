import { NodeDto } from './NodeDto';
import { EdgeDto } from './EdgeDto';

export class GraphDto {
  constructor(
    public readonly nodes: NodeDto[],
    public readonly edges: EdgeDto[],
  ) {}
}
