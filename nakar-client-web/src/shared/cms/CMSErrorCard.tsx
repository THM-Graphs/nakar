import { Alert } from "react-bootstrap";
import { handleError } from "../error/handleError.ts";

export function CMSErrorCard(props: { error: unknown }) {
  if (props.error == null) {
    return null;
  }

  return (
    <Alert variant={"danger"}>
      <span className={"small user-select-text"}>
        {handleError(props.error)}
      </span>
    </Alert>
  );
}
