# Firebase setup

The frontend now uses Firebase Authentication and Firestore for account profiles. The Firestore database is in `asia-southeast1`; its rules only allow users to create pending profiles, and reserve approval and role changes for administrators.

## First administrator

1. In Firebase Console, enable **Email/Password** under **Authentication > Sign-in method**.
2. Create the administrator account through the app's sign-up page.
3. In **Firestore Database**, open `users/{the account's Firebase UID}` and change `user_lvl` from `"2"` to `"0"`.
4. Sign in with that account. Administrators can approve new accounts from the Accounts page by changing their level to `"1"`.

Firestore Console changes use trusted project access and bypass the client security rules. Do not grant administrator access by changing a profile from the client.

Existing MySQL accounts are not imported into Firebase Authentication. Users need Firebase accounts before they can sign in, and new sign-ups begin in the pending state.

This is the authentication and user-profile stage of the migration. Other application records and features still use the existing PHP/MySQL API; this change does not migrate that data or deploy the PHP backend.
