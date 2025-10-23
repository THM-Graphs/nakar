import { useBearStore } from "../../state/useBearStore.ts";
import { Form } from "react-bootstrap";
import { useEffect } from "react";

export function DatabaseSelect(props: {
  database: string | null;
  onChange: (databaseId: string | null) => void;
}) {
  const referencedDatabases = useBearStore(
    (s) => s.room.panels.scenarios.scenarios.referencedDatabases,
  );

  useEffect(() => {
    if (referencedDatabases.length > 0 && props.database == null) {
      props.onChange(referencedDatabases[0].id);
    }
  }, [referencedDatabases]);

  return (
    <Form.Select
      className={"rounded-0 border-0 border-bottom"}
      style={{ fontSize: "13px" }}
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
