export class GetScenariosDto {
  constructor(
    public readonly scenarios: Array<{
      title: string;
      query: string;
      databaseTitle: string;
      databaseHost: string;
      databasePort: number;
      coverUrl: string;
    }>,
  ) {}
}
