import { createRef, ReactNode, useEffect, useState } from "react";
import { actions, useBearStore } from "../lib/State.ts";
import { logicalToNativePosition } from "../lib/Draggable.ts";
import interact from "interactjs";
import { EdgeDto, NodeDto } from "../shared/dto.ts";

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
        graph.edges.map((edge: EdgeDto): ReactNode => {
          return <Edge key={edge.id} edge={edge} parent={canvasHandle}></Edge>;
        })}

      {canvasHandle &&
        graph.nodes.map(
          (node: NodeDto): ReactNode => (
            <Node key={node.id} node={node} parent={canvasHandle}></Node>
          ),
        )}

      {props.children}
    </div>
  );
}

function Node(props: { node: NodeDto; parent: HTMLDivElement }) {
  const self = createRef<HTMLDivElement>();
  const [selfHandle, setSelfHandle] = useState<HTMLDivElement | null>(null);

  const nativePosition = logicalToNativePosition(
    props.node.position,
    props.parent,
  );

  useEffect(() => {
    setSelfHandle(self.current as HTMLDivElement);
  }, [self]);

  useEffect(() => {
    if (selfHandle == null) {
      return;
    }
    const slider = interact(selfHandle);
    slider.draggable({
      inertia: true,
      listeners: {
        move: (event: { dx: number; dy: number }) => {
          actions.canvas.moveNodePosition(props.node.id, {
            x: event.dx,
            y: event.dy,
          });
        },
      },
    });
  }, [selfHandle]);

  return (
    <div
      ref={self}
      className={
        "position-absolute rounded-circle d-flex justify-content-center align-items-center text-center fw-semibold"
      }
      style={{
        zIndex: 500,
        backgroundColor: props.node.backgroundColor,
        width: `${props.node.size.toString()}px`,
        height: `${props.node.size.toString()}px`,
        top: `${(nativePosition.y - props.node.size / 2).toString()}px`,
        left: `${(nativePosition.x - props.node.size / 2).toString()}px`,
      }}
    >
      <span
        style={{
          overflowWrap: "anywhere",
          fontSize: `${(props.node.size / 5).toString()}px`,
          color: props.node.displayTitleColor,
        }}
      >
        {props.node.displayTitle}
      </span>
    </div>
  );
}

const Edge = (props: { edge: EdgeDto; parent: HTMLDivElement }) => {
  const nodes = useBearStore((state) => state.canvas.graph.nodes);

  const node1 = nodes.find((n) => n.id === props.edge.startNodeId);
  const node2 = nodes.find((n) => n.id === props.edge.endNodeId);
  if (node1 == null || node2 == null) {
    return null;
  }

  const x1 = node1.position.x;
  const y1 = node1.position.y;

  const x2 = node2.position.x;
  const y2 = node2.position.y;

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
        zIndex: 500,
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
