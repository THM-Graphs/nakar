import { GraphProperty } from "../../../../../src-gen";
import { Stack, Table } from "react-bootstrap";
import { ClipboardButton } from "../../ClipboardButton.tsx";

export function PropertyDisplay(props: {
  title: string;
  properties: GraphProperty[];
}) {
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
            <td className={"small user-select-text bg-body-tertiary pt-1 pb-1"}>
              {property.slug}
            </td>
            <td
              className={
                "text-break font-monospace small bg-body-tertiary pt-1 pb-1"
              }
            >
              <Stack
                direction={"horizontal"}
                className={"align-items-baseline"}
              >
                <ClipboardButton
                  className={"me-1"}
                  text={JSON.stringify(property.value)}
                ></ClipboardButton>
                <span className={"user-select-text"}>
                  {JSON.stringify(property.value)}
                </span>
              </Stack>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
