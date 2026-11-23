---
name: firebase-angular
description: 'Build, configure, and maintain Firebase-backed Angular applications. Use for AngularFire, Firebase Authentication, Firestore data modeling and rules, Cloud Functions, Hosting, emulators, deployments, and board-game tracking features.'
argument-hint: 'Describe the Firebase or Angular feature to implement'
---

# Firebase Angular Development

Use this skill to implement Firebase features in an Angular application safely and consistently.

## When to Use

- Create or update an Angular application backed by Firebase
- Integrate AngularFire, Authentication, Firestore, Storage, Functions, or Hosting
- Design collections, queries, repositories, and typed Angular services
- Record domain data such as board games, players, sessions, scores, and rankings
- Add Firestore security rules, indexes, emulator tests, or deployment configuration
- Debug Firebase configuration, permissions, or local-emulator issues

## Workflow

1. Inspect the workspace before making changes.
   - Identify the Angular version, standalone or NgModule architecture, package manager, and existing Firebase setup.
   - Read package manifests, Angular configuration, application bootstrap, environment files, and Firebase configuration.
   - Never overwrite an existing project or expose service-account credentials.

2. Clarify requirements that affect the data model or security boundary.
   - Determine sign-in methods, whether records are private or shared, and which users may create, edit, or delete data.
   - For board-game tracking, identify the required game metadata, player identity, session details, scores, winners, and statistics.

3. Prefer the supported modular AngularFire APIs.
   - Use `provideFirebaseApp` during app bootstrap and initialize only the Firebase services the feature needs.
   - Use dependency-injected Firebase service wrappers for testability.
   - Keep Firebase document types and domain models separate when serialization differs.
   - Use typed converters or explicit mapping at the boundary rather than passing unvalidated values into components.

4. Design Firestore for the application's queries.
   - Store only fields needed by reads and queries.
   - Include denormalized display values when they avoid client-side joins, while defining an update strategy for them.
   - Prefer stable IDs, timestamps generated consistently, and immutable historical facts where appropriate.
   - For records that involve multiple users or aggregate counts, use transactions or batched writes when atomicity is required.
   - Add composite indexes in `firestore.indexes.json` for real queries rather than guessing broadly.

5. Protect data in Firebase, not only in the UI.
   - Treat Firestore security rules as the authorization boundary.
   - Require authentication explicitly where needed and validate document shape, ownership, and allowed transitions.
   - Keep development emulator rules and production rules in source control.
   - Never use an Admin SDK service account in the Angular client.

6. Handle Firebase state and errors as application state.
   - Expose Observable signals through Angular services with clear loading, empty, and error behavior.
   - Handle auth restoration and redirects without assuming the user is available immediately.
   - Convert Firebase errors into user-safe messages while retaining enough technical context for debugging.
   - Unsubscribe through Angular async patterns, `takeUntilDestroyed`, or bounded one-shot operations.

7. Test with local Firebase emulators.
   - Configure Auth, Firestore, Functions, and Storage emulators in `firebase.json` as required.
   - Run security-rule and service tests against emulators, including denied access and malformed input.
   - Test key Angular services and UI flows with mocked or emulator-backed Firebase state.
   - Never point automated tests at production Firebase projects.

8. Validate before completion.
   - Run the smallest relevant Angular tests, type checks, lint tasks, and production build.
   - Validate Firestore rules, indexes, and Firebase Hosting rewrites.
   - Verify that no secrets, emulator-only configuration, or accidental production writes are committed.
   - Summarize changed files, the commands run, and any manual Firebase Console steps still required.

## Board-Game Record Guidelines

Use separate concepts for games, memberships or player profiles, sessions, and results. A useful starting point is:

- `games/{gameId}`: catalog metadata and optional rules variants
- `users/{uid}`: display profile and preferences owned by the user
- `sessions/{sessionId}`: played-at time, game reference, status, and participant IDs
- `sessions/{sessionId}/results/{playerId}`: scores, placement, winner flag, and notes

Choose the final schema from the actual screens and queries. For common player histories, home feeds, leaderboards, and shared groups, evaluate denormalization carefully and enforce every duplicate field in rules or trusted functions. Do not assume a generic schema satisfies ranking semantics for every board game.

## Completion Checklist

- [ ] Firebase packages match the installed Angular version
- [ ] Initialization is performed exactly once in the Angular bootstrap
- [ ] Auth state restoration is handled
- [ ] Firestore reads are typed and query-driven
- [ ] Mutations validate input and use batches or transactions when needed
- [ ] Security rules are present and tested
- [ ] Emulator configuration does not affect production builds
- [ ] Environment configuration contains public Firebase client config only
- [ ] Tests and production build pass
