import { ApiProperty } from '@nestjs/swagger';
import { NodeLockCollectionEntryDto } from '../types/NodeLockCollectionEntryDto';

export class SetNodeLocksWsdto {
  @ApiProperty({ enum: ['SetNodeLocksWsdto'] })
  public type: 'SetNodeLocksWsdto';

  @ApiProperty({ type: [NodeLockCollectionEntryDto] })
  public locks: NodeLockCollectionEntryDto[];

  public constructor(data: {
    type: 'SetNodeLocksWsdto';
    locks: NodeLockCollectionEntryDto[];
  }) {
    this.type = data.type;
    this.locks = data.locks;
  }
}
