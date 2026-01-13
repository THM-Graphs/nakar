import { match } from "ts-pattern";
import { UserCardRole } from "./UserCard.tsx";

export function RoleDisplay(role: UserCardRole) {
  return match(role)
    .with("owner", () => "Owner")
    .with("collaborator", () => "Collaborator")
    .with("none", () => "-")
    .exhaustive();
}
