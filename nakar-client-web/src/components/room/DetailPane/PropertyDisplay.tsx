import { GraphProperty } from "../../../../src-gen";
import { Stack, Table } from "react-bootstrap";
import { ClipboardButton } from "../ClipboardButton.tsx";

export function PropertyDisplay(props: {
  title: string;
  properties: GraphProperty[];
}) {
  if (props.properties.length === 0) {
    return null;
  }
  return (
    <Table>
      <thead>
        <tr>
          <th className={"text-nowrap"}>{props.title}</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {props.properties.map((property) => (
          <tr key={property.slug}>
            <td className={"small user-select-text"}>{property.slug}</td>
            <td className={"text-break font-monospace small user-select-text"}>
              <Stack direction={"horizontal"}>
                <ClipboardButton
                  text={JSON.stringify(property.value)}
                ></ClipboardButton>
                {JSON.stringify(property.value)}
              </Stack>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
