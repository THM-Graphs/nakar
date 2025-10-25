export interface GetScenarioParameterDBDTO {
  readonly identifier: string;
  readonly title: string;
  readonly defaultValue: string | null;
  readonly dataType: 'json' | 'startDateTime' | 'endDateTime';
}
