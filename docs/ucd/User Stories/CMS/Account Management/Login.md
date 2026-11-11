---
Priority: ❗❗
Description: As any user, I want to log into the application so I can continue to work on my library and projects.
Implemented: true
Notes:
  - See discussion.
---

> [!note]
> We have to decide how a user can log in.
> - Use Strapi registration with an email filter
> 	- Con: High hurdle for new users
> 	- Pro: Ownership of projects and database info
> - Use a custom controller with one-time passwords
> 	- Con: Users can't change their email address. Projects and database information are lost.
> 	- Pro: Fast registration for new users.
> - DFN or another standard
> 	- Con: Requires official registration
> 	- Pro: Fastest way for new users to sign up