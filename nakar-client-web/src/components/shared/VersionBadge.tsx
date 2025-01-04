import { env } from "../../lib/env/env.ts";
import { Badge } from "react-bootstrap";

export function VersionBadge() {
  return (
    <Badge bg="secondary">
      <span>{env().VERSION}</span>
    </Badge>
  );
}
