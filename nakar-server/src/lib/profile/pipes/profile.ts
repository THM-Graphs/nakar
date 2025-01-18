export const profile = <T>(id: string, handler: () => T): T => {
  const startDate = Date.now();
  const result = handler();
  const elapsedMs = Date.now() - startDate;
  strapi.log.debug(`[PROFILER] ${id}: ${elapsedMs.toString()}ms`);
  return result;
};

export const profileAsync = async <T>(
  id: string,
  handler: () => Promise<T>,
): Promise<T> => {
  const startDate = Date.now();
  const result = await handler();
  const elapsedMs = Date.now() - startDate;
  strapi.log.debug(`[PROFILER] ${id}: ${elapsedMs.toString()}ms`);
  return result;
};
