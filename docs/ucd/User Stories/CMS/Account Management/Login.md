---
Priority: ❗❗
Description: As any user i want to log into the application so i can continue to work on my library and projects.
Implemented: true
Notes:
  - See discussion
---

> [!note]
> We have to decide how a user can log in?
> - Use Strapi register with email filter
> 	- Contra: High hurdle for new users
> 	- Pro: Ownership of projects and database info
> - Use a custom controller with one time passwords
> 	- Contra: Users can't change their mail address. Projects and database info is lost.
> 	- Pro: Fast register for new users.
> - DFN or other standard
> 	- Contra: Requires official registration
> 	- Pro: Fastest way for new users to sign up