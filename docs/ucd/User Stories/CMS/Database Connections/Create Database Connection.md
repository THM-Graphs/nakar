---
Description: I want to create custom database connections so that my scenarios can run queries in my own database.
Priority: ❗
Implemented: false
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
Persona:
  - "[[🛠️ KG Builder]]"
---

## Acceptance criteria

- [x] A project member can add a connection and use it in a scenario query.
- [x] The editor supports a title, Neo4j connection type, connection URL, username, password, optional database name, and public browser URL.
- [ ] A wizard guides the user through setting up the connection.
- [x] A Test Connection button checks the supplied connection details.
- [ ] The test warns if the database account has write access.
- [ ] The interface reminds the user to supply read-only credentials.

## Context

Connection URL example: `neo4j+s://`. The database-type discussion also included SPARQL, SQL, and RDF4J.
