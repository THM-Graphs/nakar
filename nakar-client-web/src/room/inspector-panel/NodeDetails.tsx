import { DetailPane } from "./DetailPane.tsx";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { Stack } from "react-bootstrap";
import { Label } from "../labels/Label.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { ValueDisplay } from "../histogram-panel/ValueDisplay.tsx";
import { nodeActions } from "../actions/groups/nodeActions.ts";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { AddNoteAction } from "../actions/AddNoteAction.ts";
import { NoteDisplay } from "../notes-panel/NoteDisplay.tsx";
import { NodeDto } from "../../../src-gen";
import { PropertyEntry } from "./PropertiesDisplay.tsx";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";
import { ParameterizedScenarioGroupEntry } from "./ParameterizedScenarioGroupEntry.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { NodeDetailsTabs } from "./NodeDetailsTabs.tsx";
import { NodeDetailsKnowledgeCard } from "./NodeDetailsKnowledgeCard.tsx";
import { useBearStore } from "../../state/useBearStore.ts";

export function NodeDetails(props: { node: NodeDto }) {
  const roomContext = useCanvasContext();
  const tab = useBearStore((s) => s.room.panels.inspector.tab);
  const properties: PropertyEntry[] = Object.entries(
    props.node.properties satisfies Record<string, unknown>,
  ).map(([key, value]) => ({
    slug: key,
    value: value,
  }));
  const isLoggedIn = useIsLoggedIn();

  return (
    <Stack>
      <NodeDetailsTabs />
      {tab === "knowledgeCard" && (
        <NodeDetailsKnowledgeCard node={props.node}></NodeDetailsKnowledgeCard>
      )}
      {tab === "inspector" && (
        <DetailPane
          actions={nodeActions.map((a) =>
            a.detailPaneAction(() => ({
              nodes: [props.node],
              roomContext: roomContext,
              isLoggedIn: isLoggedIn,
            })),
          )}
          subActions={
            <>
              {props.node.parameterizedScenarios.length > 0 && (
                <Collapsable
                  title={<span className={"small fw-bold"}>Scenarios</span>}
                  className={"border-top"}
                  initialState={false}
                >
                  {props.node.parameterizedScenarios.map((scenarioGroup) => (
                    <ParameterizedScenarioGroupEntry
                      scenarioGroup={scenarioGroup}
                      nodes={[props.node]}
                      key={scenarioGroup.id}
                      className={"pt-2"}
                    ></ParameterizedScenarioGroupEntry>
                  ))}
                </Collapsable>
              )}
            </>
          }
          otherProperties={[
            {
              slug: "ID",
              value: props.node.id,
            },
            {
              slug: "Labels",
              value: props.node.labels,
            },
            {
              slug: "Native Labels",
              value: props.node.nativeLabels,
            },
            {
              slug: "Source",
              value: props.node.source,
            },
            {
              slug: "Names in Query",
              value: props.node.namesInQuery,
            },
            {
              slug: "Degree",
              value: props.node.degree,
            },
            {
              slug: "Incoming Degree",
              value: props.node.inDegree,
            },
            {
              slug: "Outgoing Degree",
              value: props.node.outDegree,
            },
            {
              slug: "Cluster Size",
              value: props.node.clusterSize,
            },
            {
              slug: "Is Cluster?",
              value: props.node.isCluster,
            },
            {
              slug: "Creation Reason",
              value: props.node.creationReason,
            },
            {
              slug: "URL",
              value: props.node.url,
            },
            {
              slug: "Cover Image URL",
              value: props.node.coverImageUrl,
            },
          ]}
          properties={properties}
          title={props.node.title}
          subTitleElements={
            <Stack
              direction={"horizontal"}
              className={"p-2 flex-wrap flex-shrink-0 flex-grow-0"}
              gap={1}
            >
              {props.node.labels.map((label: string) => {
                return (
                  <Label
                    key={label}
                    label={label}
                    showAmount={false}
                    showSources={true}
                  ></Label>
                );
              })}
            </Stack>
          }
          elementId={props.node.id}
        >
          <DynamicList
            data={props.node.incomingEdges}
            filter={(exp, e) =>
              e.type.toLowerCase().includes(exp.toLowerCase())
            }
            entityNamePlural={"Incoming Edges"}
            className={"border-top"}
            render={(list) => (
              <>
                {list.map((entry) => (
                  <ValueDisplay
                    key={entry.type}
                    value={entry.count}
                    label={entry.type}
                    percentage={entry.percentage}
                  ></ValueDisplay>
                ))}
              </>
            )}
          ></DynamicList>
          <DynamicList
            data={props.node.outgoingEdges}
            filter={(exp, e) =>
              e.type.toLowerCase().includes(exp.toLowerCase())
            }
            entityNamePlural={"Outgoing Edges"}
            className={"border-top"}
            render={(list) => (
              <>
                {list.map((entry) => (
                  <ValueDisplay
                    key={entry.type}
                    value={entry.count}
                    label={entry.type}
                    percentage={entry.percentage}
                  ></ValueDisplay>
                ))}
              </>
            )}
          ></DynamicList>

          <Stack className={"border-top"} gap={0}>
            <DynamicList
              data={props.node.notes}
              render={(notes) => (
                <Stack>
                  <ActionNavbarButton
                    action={AddNoteAction.shared}
                    params={{
                      nodes: [props.node],
                      roomContext: roomContext,
                      isLoggedIn,
                    }}
                  ></ActionNavbarButton>
                  <Stack gap={3}>
                    {notes.map((note) => (
                      <NoteDisplay note={note} key={note.id}></NoteDisplay>
                    ))}
                  </Stack>
                </Stack>
              )}
              entityNamePlural={"Notes"}
            ></DynamicList>
          </Stack>
        </DetailPane>
      )}
    </Stack>
  );
}
