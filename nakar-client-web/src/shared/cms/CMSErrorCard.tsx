import { CMSCard } from "./CMSCard.tsx";
import { Stack } from "react-bootstrap";
import { handleError } from "../error/handleError.ts";

export function CMSErrorCard(props: { error: unknown }) {
  if (props.error == null) {
    return null;
  }

  return (
    <CMSCard className={"bg-danger-subtle"}>
      <Stack className={"p-3"}>
        <span className={"text-muted small"}>{handleError(props.error)}</span>
      </Stack>
    </CMSCard>
  );
}
