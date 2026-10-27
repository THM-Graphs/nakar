---
Description: As a 🛠️ KG Builder, I want to create custom database connections so that my scenarios can run queries in my own database.
Priority: ❗
Implemented: true
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
Notes:
  - See discussion.
  - See fields.
---
- Fields:
	- Title
	- Type ("Neo4j")
	- Connection URL (neo4j+s://)
	- Username
	- Password
	- Database (optional)
	- Public URL (for redirection to the browser)
- Creating a database connection is difficult, so a wizard should be used.
- A "Test Connection" button should be available to check the login credentials.
	- Warn the user if the database user has write access.
- Remind the user that only read-only users should be added.

> [!note]
> Evaluate other types of databases: SPARQL, SQL, RDF4J.