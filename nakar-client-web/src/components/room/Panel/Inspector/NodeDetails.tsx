import { Node } from "../../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { Stack } from "react-bootstrap";
import { Label } from "../../Canvas/Label.tsx";
import { DynamicList } from "../../../shared/DynamicList.tsx";
import { ValueDisplay } from "../Histogram/ValueDisplay.tsx";
import { ExpandNodesAction } from "../../../../actions/ExpandNodesAction.ts";
import { RemoveNodesAction } from "../../../../actions/RemoveNodesAction.ts";
import { FocusNodesAction } from "../../../../actions/FocusNodesAction.ts";
import { UnlockNodesAction } from "../../../../actions/UnlockNodesAction.ts";

export function NodeDetails(props: {
  node: Node;
  context: AppContext;
  roomContext: RoomContext;
}) {
  return (
    <DetailPane
      actions={[
        ExpandNodesAction.shared.detailPaneAction(() => ({
          nodes: [props.node],
          roomContext: props.roomContext,
        })),
        RemoveNodesAction.shared.detailPaneAction(() => ({
          nodes: [props.node],
          roomContext: props.roomContext,
        })),
        FocusNodesAction.shared.detailPaneAction(() => ({
          nodes: [props.node],
          roomContext: props.roomContext,
        })),
        UnlockNodesAction.shared.detailPaneAction(() => ({
          nodes: [props.node],
          roomContext: props.roomContext,
        })),
      ]}
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
        className={"border-bottom border-top"}
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
        className={"border-bottom border-top"}
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
    </DetailPane>
  );
}
