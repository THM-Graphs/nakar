import { Node } from "../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { AppContext } from "../../state/AppContext.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { Stack } from "react-bootstrap";
import { Label } from "../labels/Label.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { ValueDisplay } from "../histogram-panel/ValueDisplay.tsx";
import { nodeActions } from "../actions/groups/nodeActions.ts";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { AddNoteAction } from "../actions/AddNoteAction.ts";
import { NoteDisplay } from "../notes-panel/NoteDisplay.tsx";

export function NodeDetails(props: {
  node: Node;
  context: AppContext;
  roomContext: CanvasContext;
}) {
  return (
    <DetailPane
      actions={nodeActions.map((a) =>
        a.detailPaneAction(() => ({
          nodes: [props.node],
          roomContext: props.roomContext,
        })),
      )}
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
      ]}
      properties={props.node.properties}
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
                roomContext={props.roomContext}
              ></Label>
            );
          })}
        </Stack>
      }
      roomContext={props.roomContext}
      elementId={props.node.id}
    >
      <DynamicList
        data={props.node.incomingEdges}
        filter={(exp, e) => e.type.toLowerCase().includes(exp.toLowerCase())}
        entityNamePlural={"Incoming Edges"}
        className={"border-top"}
        render={(list) => (
          <>
            {list.map((entry) => (
              <ValueDisplay
                key={entry.type}
                value={entry.count}
                label={entry.type}
                roomContext={props.roomContext}
                percentage={entry.percentage}
              ></ValueDisplay>
            ))}
          </>
        )}
      ></DynamicList>
      <DynamicList
        data={props.node.outgoingEdges}
        filter={(exp, e) => e.type.toLowerCase().includes(exp.toLowerCase())}
        entityNamePlural={"Outgoing Edges"}
        className={"border-top"}
        render={(list) => (
          <>
            {list.map((entry) => (
              <ValueDisplay
                key={entry.type}
                value={entry.count}
                label={entry.type}
                roomContext={props.roomContext}
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
                params={{ nodes: [props.node], roomContext: props.roomContext }}
              ></ActionNavbarButton>
              <Stack gap={3}>
                {notes.map((note) => (
                  <NoteDisplay
                    note={note}
                    key={note.id}
                    roomContext={props.roomContext}
                  ></NoteDisplay>
                ))}
              </Stack>
            </Stack>
          )}
          entityNamePlural={"Notes"}
        ></DynamicList>
      </Stack>
    </DetailPane>
  );
}
