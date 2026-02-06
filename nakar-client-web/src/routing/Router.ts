// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Router {
  public static createRouter() {}

  public static getProjectPath(projectId: string): string {
    return `/project/${projectId}`;
  }

  public static getHomeUrl(): string {
    return "/";
  }

  public static getProjectEditPath(projectId: string): string {
    return `/project/${projectId}/edit`;
  }

  public static getCanvasUrl(canvasId: string): string {
    return `/canvas/${canvasId}`;
  }

  public static getRoomEditUrl(projectId: string, roomId: string): string {
    return `/project/${projectId}/room/${roomId}/edit`;
  }

  public static getEditScenarioPath(
    projectId: string,
    scenarioGroupId: string,
    scenarioId: string,
  ): string {
    return `/project/${projectId}/scenario-group/${scenarioGroupId}/scenario/${scenarioId}/edit`;
  }

  public static getEditScenarioGroupPath(
    projectId: string,
    scenarioGroupId: string,
  ): string {
    return `/project/${projectId}/scenario-group/${scenarioGroupId}/edit`;
  }
}
