import { GraphProperty } from "../../../../../src-gen";
import { Stack, Table } from "react-bootstrap";
import { ClipboardButton } from "../../ClipboardButton.tsx";
import { PropertyMenu } from "./PropertyMenu.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function PropertyDisplay(props: {
  title: string;
  properties: GraphProperty[];
  roomContext: RoomContext;
}) {
  const scenario = useBearStore(
    (s) => s.room.scenario.graph.metaData.scenario?.current,
  );
  if (props.properties.length === 0) {
    return null;
  }
  return (
    <Table className={"bg-body-tertiary"}>
      <thead>
        <tr>
          <th className={"text-nowrap bg-body-tertiary"}>{props.title}</th>
          <th className={"bg-body-tertiary"}>
            <span style={{ paddingLeft: "20px" }}>Value</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {props.properties.map((property) => (
          <tr key={property.slug}>
            <td
              className={"small user-select-text bg-body-tertiary"}
              style={{ verticalAlign: "top" }}
            >
              {property.slug}
            </td>
            <td
              className={
                "text-break small bg-body-tertiary pt-0 pb-0 align-middle pe-0"
              }
            >
              <Stack
                direction={"horizontal"}
                className={"align-items-baseline"}
              >
                <ClipboardButton
                  size={"sm"}
                  className={"me-1 align-self-baseline p-1"}
                  text={JSON.stringify(property.value)}
                ></ClipboardButton>
                <span
                  className={
                    "font-monospace user-select-text align-self-center pe-2"
                  }
                >
                  {JSON.stringify(property.value)}
                </span>
                <div className={"me-auto"}></div>
                {scenario && (
                  <PropertyMenu
                    scenario={scenario}
                    value={property.value}
                    roomContext={props.roomContext}
                  ></PropertyMenu>
                )}
              </Stack>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
