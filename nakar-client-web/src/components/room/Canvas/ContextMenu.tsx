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
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { Edge, Node } from "../../../../src-gen";
import { nodeActions } from "../../../actions/groups/nodeActions.ts";
import { ActionDropdownItem } from "../../../actions/ActionDropdownItem.tsx";
import { RoomContext } from "../../../pages/Room.tsx";
import { relationshipActions } from "../../../actions/groups/relationshipActions.ts";

export function ContextMenu(props: { roomContext: RoomContext }) {
  const onShowNodeContextMenu = useBearStore(
    (s) => s.room.ui.rendererEvents.onShowNodeContextMenu,
  );
  const onShowEdgeContextMenu = useBearStore(
    (s) => s.room.ui.rendererEvents.onShowEdgeContextMenu,
  );
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [node, setNode] = useState<Node | null>(null);
  const [edge, setEdge] = useState<Edge | null>(null);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const edges = useBearStore((s) => s.room.scenario.graph.elements.edges);
  const dropdownEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (node != null) {
      setEdge(null);
    }
  }, [node]);

  useEffect(() => {
    if (edge != null) {
      setNode(null);
    }
  }, [edge]);

  useEffect(() => {
    const subs = [
      onShowNodeContextMenu.subscribe(
        (params: { nodeId: string; position: [number, number] }) => {
          const node = nodes.find((n) => n.id === params.nodeId);
          if (node == null) {
            return;
          }
          setNode(node);
          setPosX(params.position[0]);
          setPosY(params.position[1]);
          dropdownEl.current?.click();
        },
      ),
      onShowEdgeContextMenu.subscribe(
        (params: { edgeId: string; position: [number, number] }) => {
          const edge = edges.find((n) => n.id === params.edgeId);
          if (edge == null) {
            return;
          }
          setPosX(params.position[0]);
          setPosY(params.position[1]);
          setEdge(edge);
          dropdownEl.current?.click();
        },
      ),
    ];
    return () => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, [onShowNodeContextMenu, onShowEdgeContextMenu, nodes, edges]);

  useEffect(() => {
    const listener = () => {
      setNode(null);
      setEdge(null);
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
        {node &&
          nodeActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{ nodes: [node], roomContext: props.roomContext }}
            ></ActionDropdownItem>
          ))}
        {edge &&
          relationshipActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{ edges: [edge], roomContext: props.roomContext }}
            ></ActionDropdownItem>
          ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
