# GameRecordHub development instructions

- For every bug fix or feature change, add or update unit tests that reproduce the affected behavior and protect against regression.
- Include relevant edge cases for every supported player count and every affected persistence format.
- Run `npm run test:ci` before any deployment. A deployment must not proceed if any test fails.
- Run the production build before deployment. Prefer `npm run deploy`, which enforces tests and build through the `predeploy` script.
- Validate Firestore rules after any rules change and deploy them only after their dry-run or compilation succeeds.
- Use the existing Firebase and Angular skills for Firebase-backed implementation tasks.
