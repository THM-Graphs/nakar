import { ApiProperty } from '@nestjs/swagger';

export class NodeLockCollectionEntryDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public locked: boolean;

  public constructor(data: { id: string; locked: boolean }) {
    this.id = data.id;
    this.locked = data.locked;
  }
}
