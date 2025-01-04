import { Badge } from "react-bootstrap";

export function DevelopmentIndicatorBadge() {
  return (
    <Badge bg="danger">
      {import.meta.env.DEV && <span>{import.meta.env.MODE}</span>}
    </Badge>
  );
}
