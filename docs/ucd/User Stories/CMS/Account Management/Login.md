---
Priority: ❗❗
Description: As any user, I want to log into the application so I can continue to work on my library and projects.
Implemented: true
Roles:
  - "[[🥷 Anonymous]]"
---

## Acceptance criteria

- [x] A signed-out user can sign in with an existing account and regain access to their projects.

## Context

> [!note] Login options discussed
> - Strapi registration with an email filter. It adds a barrier for new users and lets accounts retain projects and database information.
> - A custom controller with one-time passwords. Registration is quick, but users cannot change their email address and may lose their projects and database information.
> - DFN or another standard. Sign-up is quick, but an official registration is required.
