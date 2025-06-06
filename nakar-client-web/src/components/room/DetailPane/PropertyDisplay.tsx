import { GraphProperty } from "../../../../src-gen";
import { Table } from "react-bootstrap";

export function PropertyDisplay(props: {
  title: string;
  properties: GraphProperty[];
}) {
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
            <td>{property.slug}</td>
            <td className={"text-break font-monospace"}>
              {JSON.stringify(property.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
