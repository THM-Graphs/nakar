---
Priority: ❗❗
Description: I want to define which node property is used for a node title per label because the database might be misconfigured or multiple properties are interesting.
Implemented: false
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
  - "[[🥷 Outsider]]"
  - "[[🌐 Anonymous]]"
Persona:
  - "[[👁️ KG Consumer]]"
---

## Acceptance criteria

- [x] The user can select a node title property for a label.
- [ ] The user can specify multiple node title properties for a label as a comma-separated list.
- [x] For a non-cluster node without a custom title property, use the first non-blank string value in this order: `label`, `name`, `title`, `value`, `type`, `id`, `slug`. If none qualifies, use the first non-blank string value among all properties, then fall back to the node's labels joined with commas.
- [x] The custom title property is persisted per label in the canvas view settings.

## Context

Design option: Evaluate a visual template editor.
