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
}
