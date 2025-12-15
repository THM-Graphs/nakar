import { ProjectRole } from "../../src-gen";
import { match } from "ts-pattern";

export function RoleDisplay(role: ProjectRole) {
  return match(role)
    .with("owner", () => "Owner")
    .with("collaborator", () => "Collaborator")
    .with("none", () => "-")
    .exhaustive();
}
