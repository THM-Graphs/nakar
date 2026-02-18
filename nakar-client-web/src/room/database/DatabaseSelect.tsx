import { Form } from "react-bootstrap";
import { useEffect } from "react";
import { useCanvasContext } from "../../pages/Canvas.tsx";

export function DatabaseSelect(props: {
  database: string | null;
  onChange: (databaseId: string | null) => void;
}) {
  const canvasContext = useCanvasContext();
  const referencedDatabases = canvasContext.initialRoomData.databases;
  useEffect(() => {
    if (referencedDatabases.length > 0 && props.database == null) {
      props.onChange(referencedDatabases[0].id);
    }
  }, [referencedDatabases]);

  return (
    <Form.Select
      className={"rounded-0 border-0 bg-body-tertiary"}
      style={{ fontSize: "13px", width: "150px" }}
      value={props.database ?? ""}
      onChange={(event) => {
        if (event.target.value === "") {
          props.onChange(null);
        } else {
          props.onChange(event.target.value);
        }
      }}
    >
      <option value={""} disabled={false}>
        Select a database...
      </option>
      {referencedDatabases.map((referencedDatabase) => (
        <option value={referencedDatabase.id} key={referencedDatabase.id}>
          {referencedDatabase.title}
        </option>
      ))}
    </Form.Select>
  );
}
