export const bindLogicalPositionIntoParent = (
  virtualPos: { x: number; y: number },
  parentElement: HTMLDivElement,
  element: HTMLDivElement,
  useCenter: boolean,
): { x: number; y: number } => {
  return {
    x: Math.min(
      Math.max(
        virtualPos.x,
        useCenter ? element.getBoundingClientRect().width / 2 : 0,
      ),
      parentElement.getBoundingClientRect().width -
        (useCenter
          ? element.getBoundingClientRect().height / 2
          : element.getBoundingClientRect().width),
    ),
    y: Math.min(
      Math.max(
        virtualPos.y,
        useCenter ? element.getBoundingClientRect().height / 2 : 0,
      ),
      parentElement.getBoundingClientRect().height -
        (useCenter
          ? element.getBoundingClientRect().height / 2
          : element.getBoundingClientRect().height),
    ),
  };
};

export const logicalToNativePosition = (
  virtualPos: Position,
  parentElement: HTMLDivElement,
): Position => {
  return {
    x: virtualPos.x + parentElement.getBoundingClientRect().x,
    y: virtualPos.y + parentElement.getBoundingClientRect().y,
  };
};

export interface Position {
  x: number;
  y: number;
}
