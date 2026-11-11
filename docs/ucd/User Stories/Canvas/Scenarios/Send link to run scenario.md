---
Implemented: true
Priority: ❗❗
Description: As a 🛠️ KG Builder, I want to generate a shareable link to a specific room that includes a scenario trigger (e.g., via URL parameters) so that users coming from external websites can directly enter NAKAR and start a predefined scenario without manual interaction.
---

### Acceptance criteria

1. Link structure
    - The KG Builder can generate a link to a specific room.
    - The link supports URL parameters (e.g., `?scenario=xyz`).
2. Scenario trigger
    - If the link contains a valid scenario parameter, the corresponding scenario starts automatically when the user enters the room.
    - If no scenario is specified, no scenario starts automatically.
3. Validation
    - If an invalid scenario parameter or one referencing a nonexistent scenario is provided, the system does not start any scenario.
4. Accessibility
    - The link works for external users without prior navigation within NAKAR.
5. Reusability
    - The generated link can be used multiple times and behaves consistently.
6. Tracking (optional, if relevant)
    - The system can detect that the user arrived via an external link containing a scenario parameter.
