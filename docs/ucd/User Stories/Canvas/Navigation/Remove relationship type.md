---
Priority: ❗❗
Description: As a 👤 KG Consumer, I want to remove all relationships of a given type because they are no longer relevant.
Notes:
Implemented: true
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
  - "[[👤 Outsider]]"
  - "[[🥷 Anonymous]]"
---

## Bugs:

- Currently, all relationship IDs of the type are sent to the server. Create or use a new HTTP route to provide only the relationship type.