import { PropertyDto } from './PropertyDto';

export class NodeDto {
  constructor(
    public readonly id: string,
    public readonly displayTitle: string,
    public readonly type: string,
    public readonly properties: PropertyDto[],
  ) {
  }
}
