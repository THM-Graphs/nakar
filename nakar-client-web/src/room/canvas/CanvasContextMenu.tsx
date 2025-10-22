import {
  ForwardedRef,
  forwardRef,
  MouseEventHandler,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dropdown } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { Edge, Node } from "../../../src-gen";
import { nodeActions } from "../../actions/groups/nodeActions.ts";
import { ActionDropdownItem } from "../../actions/ActionDropdownItem.tsx";
import { RoomContext } from "../../pages/Room.tsx";
import { relationshipActions } from "../../actions/groups/relationshipActions.ts";

export function CanvasContextMenu(props: { roomContext: RoomContext }) {
  const onShowNodeContextMenu = useBearStore(
    (s) => s.room.ui.rendererEvents.onShowNodeContextMenu,
  );
  const onShowEdgeContextMenu = useBearStore(
    (s) => s.room.ui.rendererEvents.onShowEdgeContextMenu,
  );
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState<Node[] | null>(null);
  const [selectedEdges, setSelectedEdges] = useState<Edge[] | null>(null);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const edges = useBearStore((s) => s.room.scenario.graph.elements.edges);
  const selectedElements: string[] = useBearStore(
    (s) => s.room.panels.inspector.element,
  );
  const dropdownEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedNodes != null) {
      setSelectedEdges(null);
    }
  }, [selectedNodes]);

  useEffect(() => {
    if (selectedEdges != null) {
      setSelectedNodes(null);
    }
  }, [selectedEdges]);

  useEffect(() => {
    const subs = [
      onShowNodeContextMenu.subscribe(
        (params: { nodeId: string; position: [number, number] }) => {
          if (selectedElements.includes(params.nodeId)) {
            const newSelectedNodes: Node[] = selectedElements.reduce<Node[]>(
              (akku, next) => {
                const foundNodes = nodes.find((n) => n.id === next);
                if (foundNodes == null) {
                  return akku;
                } else {
                  return [...akku, foundNodes];
                }
              },
              [],
            );
            setSelectedNodes(newSelectedNodes);
          } else {
            const selectedNode = nodes.find((n) => n.id === params.nodeId);
            if (selectedNode == null) {
              return;
            }
            setSelectedNodes([selectedNode]);
          }
          setPosX(params.position[0]);
          setPosY(params.position[1]);
          dropdownEl.current?.click();
        },
      ),
      onShowEdgeContextMenu.subscribe(
        (params: { edgeId: string; position: [number, number] }) => {
          if (selectedElements.includes(params.edgeId)) {
            const foundEdges: Edge[] = selectedElements.reduce<Edge[]>(
              (akku, next) => {
                const edge = edges.find((e) => e.id === next);
                if (edge == null) {
                  return akku;
                } else {
                  return [...akku, edge];
                }
              },
              [],
            );
            setSelectedEdges(foundEdges);
          } else {
            const selectedEdge = edges.find((e) => e.id === params.edgeId);
            if (selectedEdge == null) {
              return;
            }
            setSelectedEdges([selectedEdge]);
          }
          setPosX(params.position[0]);
          setPosY(params.position[1]);
          dropdownEl.current?.click();
        },
      ),
    ];
    return () => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, [
    onShowNodeContextMenu,
    onShowEdgeContextMenu,
    nodes,
    edges,
    selectedElements,
  ]);

  useEffect(() => {
    const listener = () => {
      setSelectedNodes(null);
      setSelectedEdges(null);
    };
    dropdownEl.current?.addEventListener("hidden.bs.dropdown", listener);
    return () => {
      dropdownEl.current?.removeEventListener("hidden.bs.dropdown", listener);
    };
  }, [dropdownEl]);

  const CustomToggle = forwardRef(
    (
      {
        children,
        onClick,
      }: { children: ReactNode; onClick: MouseEventHandler<HTMLDivElement> },
      ref: ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} onClick={onClick}>
        {children}
      </div>
    ),
  );

  return (
    <Dropdown
      className={"position-absolute"}
      style={{
        translate: `${posX.toString()}px ${posY.toString()}px`,
        zIndex: 1050,
      }}
    >
      <Dropdown.Toggle as={CustomToggle} ref={dropdownEl}></Dropdown.Toggle>
      <Dropdown.Menu className={"rounded-0"}>
        {selectedNodes &&
          nodeActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{ nodes: selectedNodes, roomContext: props.roomContext }}
            ></ActionDropdownItem>
          ))}
        {selectedEdges &&
          relationshipActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{ edges: selectedEdges, roomContext: props.roomContext }}
            ></ActionDropdownItem>
          ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
