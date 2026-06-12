import {
  ForwardedRef,
  forwardRef,
  Fragment,
  MouseEventHandler,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dropdown } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { nodeActions } from "../actions/groups/nodeActions.ts";
import { ActionDropdownItem } from "../actions/ActionDropdownItem.tsx";
import { relationshipActions } from "../actions/groups/relationshipActions.ts";
import {
  EdgeDto,
  NodeDto,
  NodeParameterizedScenarioDto,
  NodeParameterizedScenarioGroupDto,
} from "api-client";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import {
  RunScenarioAction,
  RunScenarioActionParams,
} from "../actions/RunScenarioAction.ts";
import { calculateIntersectionOfScenarioGroups } from "../scenarios-panel/calculateIntersectionOfScenarioGroups.ts";

export function CanvasContextMenu() {
  const roomContext = useCanvasContext();
  const onShowNodeContextMenu = useBearStore(
    (s) => s.room.ui.rendererEvents.onShowNodeContextMenu,
  );
  const onShowEdgeContextMenu = useBearStore(
    (s) => s.room.ui.rendererEvents.onShowEdgeContextMenu,
  );
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState<NodeDto[] | null>(null);
  const [selectedEdges, setSelectedEdges] = useState<EdgeDto[] | null>(null);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const edges = useBearStore((s) => s.room.scenario.graph.elements.edges);
  const selectedElements: string[] = useBearStore(
    (s) => s.room.panels.inspector.element,
  );
  const dropdownEl = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = useIsLoggedIn();
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );
  const scenarioGroups = useBearStore(
    (s) => s.room.panels.scenarios.scenarios.scenarioGroups,
  );

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
          const selectedNode = nodes.find((n) => n.id === params.nodeId);
          if (selectedNode == null) {
            return;
          }

          if (selectedElements.includes(params.nodeId)) {
            const newSelectedNodes: NodeDto[] = selectedElements.reduce<
              NodeDto[]
            >((akku, next) => {
              const foundNodes = nodes.find((n) => n.id === next);
              if (foundNodes == null) {
                return akku;
              } else {
                return [...akku, foundNodes];
              }
            }, []);
            setSelectedNodes(newSelectedNodes);
          } else {
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
            const foundEdges: EdgeDto[] = selectedElements.reduce<EdgeDto[]>(
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

  const commonNodeScenarios: NodeParameterizedScenarioGroupDto[] =
    useMemo(() => {
      if (selectedNodes == null) {
        return [];
      }
      return calculateIntersectionOfScenarioGroups(
        selectedNodes.map((n) => n.parameterizedScenarios),
      );
    }, [selectedNodes]);

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
      <Dropdown.Menu className={"rounded"}>
        {selectedNodes &&
          nodeActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{
                nodes: selectedNodes,
                roomContext: roomContext,
                isLoggedIn: isLoggedIn,
              }}
            ></ActionDropdownItem>
          ))}
        {selectedEdges &&
          relationshipActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{
                edges: selectedEdges,
                roomContext: roomContext,
              }}
            ></ActionDropdownItem>
          ))}

        {commonNodeScenarios.length > 0 && (
          <>
            {commonNodeScenarios.map((parameterizedScenarioGroup) => {
              const scenarioGroup = scenarioGroups.find(
                (sg) => sg.id === parameterizedScenarioGroup.id,
              );
              if (scenarioGroup == null) {
                return null;
              }
              return (
                <Fragment key={scenarioGroup.id}>
                  <Dropdown.Divider></Dropdown.Divider>
                  <Dropdown.ItemText className={"small text-muted"}>
                    {scenarioGroup.title}
                  </Dropdown.ItemText>
                  {parameterizedScenarioGroup.scenarios.map(
                    (parameterizedScenario: NodeParameterizedScenarioDto) => {
                      const scenario = scenarioGroup.scenarios.find(
                        (s) => s.id === parameterizedScenario.id,
                      );
                      if (scenario == null) {
                        return null;
                      }
                      return (
                        <Fragment key={scenario.id}>
                          <ActionDropdownItem
                            action={RunScenarioAction.shared}
                            params={
                              {
                                roomContext: roomContext,
                                scenario: scenario,
                                showRunScenarioModal: showRunScenarioModal,
                                nodes: selectedNodes ?? [],
                              } satisfies RunScenarioActionParams
                            }
                          ></ActionDropdownItem>
                        </Fragment>
                      );
                    },
                  )}
                </Fragment>
              );
            })}
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
