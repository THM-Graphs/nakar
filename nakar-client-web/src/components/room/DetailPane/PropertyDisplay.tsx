import { GraphProperty } from "../../../../src-gen";
import { Table } from "react-bootstrap";

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
          <th>{props.title}</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {props.properties.map((property) => (
          <tr key={property.slug}>
            <td style={{ userSelect: "text" }}>{property.slug}</td>
            <td
              className={"text-break font-monospace"}
              style={{ userSelect: "text" }}
            >
              {JSON.stringify(property.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
