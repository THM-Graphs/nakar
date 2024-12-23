import interact from "interactjs";

export const registerDrag = (
  windowHeader: HTMLElement,
  window: HTMLElement,
  windowParent: HTMLElement,
) => {
  let windowPosition: { x: number; y: number } = { x: 20, y: 20 };
  const applyPosition = () => {
    window.style.top = `${windowPosition.y.toString()}px`;
    window.style.left = `${windowPosition.x.toString()}px`;
  };
  const slider = interact(windowHeader);
  slider.draggable({
    inertia: true,
    listeners: {
      move(event: { dx: number; dy: number }) {
        windowPosition = {
          x: Math.min(
            Math.max(windowPosition.x + event.dx, 0),
            windowParent.getBoundingClientRect().width -
              window.getBoundingClientRect().width,
          ),
          y: Math.min(
            Math.max(windowPosition.y + event.dy, 0),
            windowParent.getBoundingClientRect().height -
              window.getBoundingClientRect().height,
          ),
        };
        applyPosition();
      },
    },
  });
  applyPosition();
};
