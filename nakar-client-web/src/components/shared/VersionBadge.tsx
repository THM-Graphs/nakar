import { Env } from "../../lib/env/env.ts";
import { Badge } from "react-bootstrap";

export function VersionBadge(props: { env: Env }) {
  return (
    <Badge bg="secondary">
      <span>{props.env.VERSION}</span>
    </Badge>
  );
}
