import { PropertyDto } from './PropertyDto';

export class EdgeDto {
  constructor(
    public readonly id: string,
    public readonly startNodeId: string,
    public readonly endNodeId: string,
    public readonly type: string,
    public readonly properties: PropertyDto[],
  ) {}
}
