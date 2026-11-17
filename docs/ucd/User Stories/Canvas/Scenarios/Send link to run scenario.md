---
Implemented: true
Priority: ❗❗
Description: As a 🛠️ KG Builder, I want to generate a shareable link to a specific room that includes a scenario trigger (e.g., via URL parameters) so that users coming from external websites can directly enter NAKAR and start a predefined scenario without manual interaction.
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
  - "[[👤 Outsider]]"
  - "[[🥷 Anonymous]]"
---

## Acceptance criteria

- [x] The user can generate a shareable URL for the room's canvas with the scenario and arguments encoded as query parameters.
- [x] A valid URL starts the scenario on entry.
- [x] Entering without a scenario parameter does not trigger a scenario.
- [x] An invalid or nonexistent scenario reference does not start a scenario.
- [x] External users can open the link directly when the room policy permits access.
- [x] The same URL can be used on repeated visits.

## Context

Optional follow-up: Track whether the user arrived on an external link containing a scenario parameter.
