export class GetScenariosDto {
  constructor(public readonly databases: Array<GetDatabaseDto>) {}
}

export class GetDatabaseDto {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly host: string,
    public readonly port: number,
    public readonly scenarios: Array<GetScenarioDto>,
  ) {}
}

export class GetScenarioDto {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly query: string,
    public readonly databaseId: string,
    public readonly databaseTitle: string,
    public readonly databaseHost: string,
    public readonly databasePort: number,
    public readonly coverUrl: string,
  ) {}
}
