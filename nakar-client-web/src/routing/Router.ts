// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Router {
  public static createRouter() {}

  public static getProjectPath(projectId: string): string {
    return `/project/${projectId}`;
  }

  public static getHomePath(): string {
    return `/`;
  }

  public static getProjectEditPath(projectId: string): string {
    return `/project/${projectId}/edit`;
  }

  public static getCanvasPath(roomId: string, canvasId: string): string {
    return `/room/${roomId}/canvas/${canvasId}`;
  }

  public static getRoomEditPath(projectId: string, roomId: string): string {
    return `/project/${projectId}/room/${roomId}/edit`;
  }

  public static getRoomPath(roomId: string): string {
    return `/room/${roomId}`;
  }

  public static getRoomUrl(roomId: string): string {
    return `${window.location.origin}/room/${roomId}`;
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

  public static getDatabaseConnectionEditPath(
    projectId: string,
    databaseId: string,
  ): string {
    return `/project/${projectId}/database-connection/${databaseId}/edit`;
  }

  public static getCommonPropertyEditPath(
    projectId: string,
    commonPropertyId: string,
  ): string {
    return `/project/${projectId}/common-property/${commonPropertyId}/edit`;
  }
}
