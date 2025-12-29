export function getClassName(obj: unknown): string {
  if (obj instanceof Object) {
    return obj.constructor.name;
  }
  return '<global>';
}
