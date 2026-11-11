---
Description: As a 🛠️ KG Builder, I want to delete database connections to clean up unused databases.
Priority: ❗
Implemented: true
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
Notes:
  - If any queries in the project's scenarios use the database connection, a warning will be displayed with an overview of which scenarios use it.
  - The warning should state that the scenarios will be deleted as well.
---
