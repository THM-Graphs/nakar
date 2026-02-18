import { match } from "ts-pattern";
import { Panel } from "../../shared/elements/Panel.tsx";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { Stack } from "react-bootstrap";
import { NodeLabelColors } from "../labels/NodeLabelColors.tsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { nodeActions } from "../actions/groups/nodeActions.ts";
import { relationshipActions } from "../actions/groups/relationshipActions.ts";
import {
  getBackgroundColorOfColor,
  getBackgroundColorOfLabel,
} from "../color/getBackgroundColor.ts";
import { useColorSchema } from "../color/useColorSchema.ts";
import { EdgeDto, NodeDto, ScenarioGroupDto } from "../../../src-gen";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";
import { Fragment, useMemo } from "react";
import { NodeParameterizedScenarioEntry } from "./NodeParameterizedScenarioEntry.tsx";

export function InspectorPanel() {
  const roomContext = useCanvasContext();
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  const elements = useMemo(() => {
    return inspector.element.reduce<(NodeDto | EdgeDto)[]>((akku, next) => {
      const foundElement =
        graphElements.nodes.find((n) => n.id === next) ??
        graphElements.edges.find((e) => e.id === next);
      if (foundElement) {
        return [...akku, foundElement];
      } else {
        return akku;
      }
    }, []);
  }, [inspector.element]);

  const nodes: NodeDto[] = useMemo(() => {
    return elements.reduce<NodeDto[]>(
      (akku, next) => ("labels" in next ? [...akku, next] : akku),
      [],
    );
  }, [elements]);
  const edges: EdgeDto[] = useMemo(() => {
    return elements.reduce<EdgeDto[]>(
      (akku, next) => ("startNodeId" in next ? [...akku, next] : akku),
      [],
    );
  }, [elements]);
  const isLoggedIn = useIsLoggedIn();
  const commonNodeScenarios: ScenarioGroupDto[] = useMemo(() => {
    return calculateIntersectionOfScenarioGroups(
      nodes.map((n) => n.parameterizedScenarios),
    );
  }, [nodes]);

  return (
    <Panel
      direction={"right"}
      onClose={() => {
        inspector.hide();
      }}
      title={"Inspector"}
    >
      {match(elements.length)
        .with(0, () => <EmptyInspector></EmptyInspector>)
        .with(1, () => {
          const firstElement = elements[0];
          return <InspectorForType element={firstElement}></InspectorForType>;
        })
        .otherwise(() => {
          return (
            <Stack gap={3}>
              {nodes.length > 0 && (
                <Stack className={"flex-grow-0"} gap={3}>
                  <Collapsable
                    title={
                      <span className={"small fw-bold"}>Node Actions</span>
                    }
                    initialState={false}
                  >
                    <Stack direction={"horizontal"} className={"flex-wrap"}>
                      {nodeActions.map((action) => (
                        <Fragment key={action.slug()}>
                          <ActionNavbarButton
                            action={action}
                            params={{
                              nodes: nodes,
                              roomContext: roomContext,
                              isLoggedIn: isLoggedIn,
                            }}
                            className={"w-50"}
                          ></ActionNavbarButton>
                        </Fragment>
                      ))}
                    </Stack>
                  </Collapsable>
                  {commonNodeScenarios.map((sg) => (
                    <Fragment key={sg.id}>
                      <Collapsable
                        initialState={false}
                        title={
                          <span className={"small fw-bold"}>{sg.title}</span>
                        }
                      >
                        {sg.scenarios.map((s) => (
                          <Fragment key={s.id}>
                            <NodeParameterizedScenarioEntry
                              scenario={s}
                              nodes={nodes}
                            ></NodeParameterizedScenarioEntry>
                          </Fragment>
                        ))}
                      </Collapsable>
                    </Fragment>
                  ))}
                  <DynamicList
                    data={nodes}
                    render={(list) => (
                      <>
                        {list.map((element) => (
                          <InspectorPanelForMultiType
                            element={element}
                            key={element.id}
                          ></InspectorPanelForMultiType>
                        ))}
                      </>
                    )}
                    entityNamePlural={"Selected Nodes"}
                  ></DynamicList>
                </Stack>
              )}
              {edges.length > 0 && (
                <Stack className={"flex-grow-0"} gap={3}>
                  <DynamicList
                    data={relationshipActions}
                    render={(actions) => (
                      <>
                        {actions.map((action) => (
                          <ActionNavbarButton
                            action={action}
                            key={action.slug()}
                            params={{
                              edges: edges,
                              roomContext: roomContext,
                            }}
                          ></ActionNavbarButton>
                        ))}
                      </>
                    )}
                    entityNamePlural={"Relationship Actions"}
                  ></DynamicList>
                  <DynamicList
                    data={edges}
                    render={(list) => (
                      <>
                        {list.map((element) => (
                          <InspectorPanelForMultiType
                            element={element}
                            key={element.id}
                          ></InspectorPanelForMultiType>
                        ))}
                      </>
                    )}
                    entityNamePlural={"Selected Relationships"}
                  ></DynamicList>
                </Stack>
              )}
              <div className={"flex-grow-1"}></div>
            </Stack>
          );
        })}
    </Panel>
  );
}

function EmptyInspector() {
  return (
    <span className={"text-muted small fst-italic align-self-center p-5"}>
      Inspector
    </span>
  );
}

function InspectorForType(props: { element: NodeDto | EdgeDto }) {
  if ("title" in props.element) {
    return <NodeDetails node={props.element}></NodeDetails>;
  } else {
    return <EdgeDetails edge={props.element}></EdgeDetails>;
  }
}

function InspectorPanelForMultiType(props: { element: NodeDto | EdgeDto }) {
  const title =
    "title" in props.element ? props.element.title : props.element.type;
  const colorSchema = useColorSchema();
  const graphLabels = useBearStore(
    (s) => s.room.scenario.graph.elements.labels,
  );

  return (
    <Collapsable
      title={
        <Stack direction={"horizontal"} className={"ellipsis"}>
          {"title" in props.element ? (
            <NodeLabelColors
              colors={
                props.element.customColor
                  ? [
                      getBackgroundColorOfColor(
                        props.element.customColor,
                        colorSchema,
                      ),
                    ]
                  : props.element.labels.map((next) => {
                      const label =
                        graphLabels.find((gl) => gl.label === next) ?? null;
                      return getBackgroundColorOfLabel(label, colorSchema);
                    }, [])
              }
            ></NodeLabelColors>
          ) : null}
          <span className={"small ellipsis"}>{title}</span>
        </Stack>
      }
      className={"flex-grow-0"}
    >
      <InspectorForType element={props.element}></InspectorForType>
    </Collapsable>
  );
}

/**
 * Calculates the intersection of multiple ScenarioGroupDto lists.
 *
 * The function returns only those ScenarioGroupDto objects that:
 * - exist in every provided list (matched by `group.id`)
 * - and contain only those ScenarioDto objects that also exist
 *   in every corresponding group across all lists (matched by `scenario.id`)
 *
 * Behavior:
 * - Groups not present in all lists are removed.
 * - Within matching groups, scenarios not present in all lists are removed.
 * - Groups that end up with no remaining scenarios are removed entirely.
 * - The order of groups follows the order of the first list.
 *
 * @param {ScenarioGroupDto[][]} scenarioGroups
 * An array of ScenarioGroupDto arrays. Each inner array represents
 * a separate group list to be intersected.
 *
 * @returns {ScenarioGroupDto[]}
 * A new array containing the intersected ScenarioGroupDto objects
 * with their intersected scenarios.
 *
 * @example
 * // Input:
 * // List A: Group1[S1, S2], Group2[S3]
 * // List B: Group1[S2], Group2[S3, S4]
 *
 * // Output:
 * // Group1[S2], Group2[S3]
 */
function calculateIntersectionOfScenarioGroups(
  scenarioGroups: ScenarioGroupDto[][],
): ScenarioGroupDto[] {
  if (!scenarioGroups.length) {
    return [];
  }

  // 1️⃣ Gruppen-Schnittmenge bilden (nach id)
  const baseGroups = new Map<string, ScenarioGroupDto>();

  for (const group of scenarioGroups[0]) {
    baseGroups.set(group.id, {
      ...group,
      scenarios: [...group.scenarios],
    });
  }

  for (let i = 1; i < scenarioGroups.length; i++) {
    const currentGroupMap = new Map(scenarioGroups[i].map((g) => [g.id, g]));

    for (const [groupId, baseGroup] of baseGroups) {
      const matchingGroup = currentGroupMap.get(groupId);

      if (!matchingGroup) {
        baseGroups.delete(groupId);
        continue;
      }

      // 2️⃣ Szenario-Schnittmenge innerhalb der Gruppe
      const currentScenarioIds = new Set(
        matchingGroup.scenarios.map((s) => s.id),
      );

      baseGroup.scenarios = baseGroup.scenarios.filter((s) =>
        currentScenarioIds.has(s.id),
      );

      // 3️⃣ Gruppe entfernen, wenn keine Szenarien übrig bleiben
      if (baseGroup.scenarios.length === 0) {
        baseGroups.delete(groupId);
      }
    }
  }

  return Array.from(baseGroups.values());
}
