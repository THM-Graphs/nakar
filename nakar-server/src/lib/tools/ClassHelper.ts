export class ClassHelper {
  public static getName(obj: unknown): string {
    if (obj instanceof Object) {
      return obj.constructor.name;
    }
    return '<global>';
  }
}
