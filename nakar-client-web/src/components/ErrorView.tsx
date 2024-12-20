import { Alert, Table } from "react-bootstrap";

export function ErrorView(props: { error: unknown }) {
  const message = (() => {
    if (props.error instanceof Error) {
      return props.error.message;
    } else if (typeof props.error == "string") {
      return props.error;
    } else if (typeof props.error == "object") {
      return (
        <>
          <h6>An Error occured:</h6>
          <Table striped bordered width={"auto"} className={"d-inline-block"}>
            <tbody>
              {Object.entries(props.error as Record<string, unknown>).map(
                ([k, v]) => (
                  <tr key={JSON.stringify(k)}>
                    <td>{JSON.stringify(k)}</td>
                    <td>{JSON.stringify(v)}</td>
                  </tr>
                ),
              )}
            </tbody>
          </Table>
        </>
      );
    } else {
      return JSON.stringify(props.error);
    }
  })();

  return <Alert variant={"danger"}>{message}</Alert>;
}
