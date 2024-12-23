import { createRef, ReactNode, useEffect, useState } from "react";
import { useBearStore } from "../lib/State.ts";
import { logicalToNativePosition } from "../lib/Draggable.ts";
import type { Interactable } from "@interactjs/core/Interactable";
import interact from "interactjs";

export function Canvas(props: { children: ReactNode }) {
  const graph = useBearStore((state) => state.canvas.graph);
  const canvasRef = createRef<HTMLDivElement>();
  const [canvasHandle, setCanvasHandle] = useState<HTMLDivElement | null>();

  useEffect(() => {
    setCanvasHandle(canvasRef.current);
  }, [canvasRef]);

  return (
    <div className={"flex-grow-1"} ref={canvasRef}>
      {canvasHandle &&
        graph.edges.map((edge): ReactNode => {
          const node1 = graph.nodes.find((n) => n.id === edge.nodeIdStart);
          const node2 = graph.nodes.find((n) => n.id === edge.nodeIdEnd);
          if (node1 == null || node2 == null) {
            return null;
          }
          return (
            <Edge
              key={edge.id}
              node1={{
                x: node1.position.x,
                y: node1.position.y,
              }}
              node2={{
                x: node2.position.x,
                y: node2.position.y,
              }}
              parent={canvasHandle}
            ></Edge>
          );
        })}
      {canvasHandle &&
        graph.nodes.map((node) => (
          <Node
            id={node.id}
            key={node.id}
            title={node.displayTitle}
            position={node.position}
            backgroundColor={node.backgroundColor}
            displayTitleColor={node.displayTitleColor}
            size={node.size}
            parent={canvasHandle}
          ></Node>
        ))}

      {props.children}
    </div>
  );
}

function Node(props: {
  id: string;
  title: string;
  size: number;
  backgroundColor: string;
  displayTitleColor: string;
  position: { x: number; y: number };
  parent: HTMLDivElement;
}) {
  const moveNodePosition = useBearStore(
    (state) => state.canvas.moveNodePosition,
  );
  const self = createRef<HTMLDivElement>();
  const [selfHandle, setSelfHandle] = useState<HTMLDivElement | null>(null);
  const [slider, setSlider] = useState<Interactable | null>(null);

  const nativePosition = logicalToNativePosition(props.position, props.parent);

  useEffect(() => {
    setSelfHandle(self.current as HTMLDivElement);
  }, [self]);

  useEffect(() => {
    if (selfHandle == null) {
      return;
    }
    setSlider(interact(selfHandle));
  }, [selfHandle]);

  useEffect(() => {
    if (slider == null || selfHandle == null) {
      return;
    }
    slider.draggable({
      inertia: true,
      listeners: {
        move: (event: { dx: number; dy: number }) => {
          moveNodePosition(
            props.id,
            { x: event.dx, y: event.dy },
            selfHandle,
            props.parent,
          );
        },
      },
    });
  }, [slider]);

  return (
    <div
      ref={self}
      className={
        "position-absolute rounded-circle d-flex justify-content-center align-items-center text-center fw-semibold"
      }
      style={{
        backgroundColor: props.backgroundColor,
        width: `${props.size.toString()}px`,
        height: `${props.size.toString()}px`,
        top: `${(nativePosition.y - props.size / 2).toString()}px`,
        left: `${(nativePosition.x - props.size / 2).toString()}px`,
      }}
    >
      <span
        style={{
          overflowWrap: "anywhere",
          fontSize: `${(props.size / 5).toString()}px`,
          color: props.displayTitleColor,
        }}
      >
        {props.title}
      </span>
    </div>
  );
}

const Edge = (props: {
  node1: { x: number; y: number };
  node2: { x: number; y: number };
  parent: HTMLDivElement;
}) => {
  const x1 = props.node1.x;
  const y1 = props.node1.y;

  const x2 = props.node2.x;
  const y2 = props.node2.y;
  // Berechne die Länge der Linie
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  // Berechne den Winkel der Linie in Grad
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  // Berechne die Mitte der Linie
  const midX = x1;
  const midY = y1;

  const nativePosition = logicalToNativePosition(
    { x: midX, y: midY },
    props.parent,
  );

  return (
    <div
      style={{
        position: "absolute",
        top: `${nativePosition.y.toString()}px`,
        left: `${nativePosition.x.toString()}px`,
        width: `${length.toString()}px`,
        height: "1px",
        backgroundColor: "white",
        transform: `rotate(${angle.toString()}deg)`,
        transformOrigin: "0 0",
      }}
    />
  );
};
