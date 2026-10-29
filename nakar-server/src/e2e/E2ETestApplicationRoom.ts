import type { RoomVisibilityDto } from '../lib/schema/dtos/RoomVisibilityDto';

export class E2ETestApplicationRoom {
  public constructor(
    public readonly documentId: string,
    public readonly title: string,
    public readonly visibility: RoomVisibilityDto,
  ) {}
}
