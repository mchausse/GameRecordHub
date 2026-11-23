# GameRecordHub

Angular 19 application for recording board game sessions, backed by Firebase Authentication and Cloud Firestore.

## Firebase project

- Project ID: `gamerecordhub-ce47c`
- Web app: `GameRecordHub`
- Authentication: Google Sign-in
- Firestore: Standard edition, `(default)` database in `nam5`
- Hosting: https://gamerecordhub-ce47c.web.app

The Firebase web configuration in `src/app/core/firebase/firebase.ts` contains public client identifiers, not server credentials. Never add service-account keys to this repository.

## Local development

```bash
npm install
npm start
```

Open `http://localhost:4200`. Google Sign-in and `localhost` are configured as authorized Firebase Authentication origins.

## Build and test

```bash
npm run build
npm run test:ci
npm run test:coverage
```

## Code quality and test coverage

The `sonarcloud.yml` GitHub Actions workflow runs the tests, produces LCOV line
coverage, builds the app, and sends the result to SonarQube Cloud. The SonarQube
Cloud Free plan analyzes public GitHub repositories for bugs, vulnerabilities,
code smells, technical debt, and test coverage.

Complete these one-time steps before the first workflow run:

1. Ensure the GitHub repository is public.
2. Import `mchausse/GameRecordHub` into a SonarQube Cloud organization with the
   SonarQube Cloud GitHub integration.
3. Choose **With GitHub Actions** as the analysis method and enable secretless
   analysis under **Organization settings > Analysis**. The workflow uses GitHub
   OIDC, so no `SONAR_TOKEN` secret is required.
4. Disable Automatic Analysis for the project so CI-based analysis can import
   the LCOV report.

SonarQube Cloud calculates technical debt from code smells and reports both
covered and uncovered source lines. Generated reports in `coverage/` are not
committed.

## Deploy Firebase resources

The Firebase project alias is configured in `.firebaserc`.

```bash
npx -y firebase-tools@latest deploy --only auth,firestore:rules
npm run build
npx -y firebase-tools@latest deploy --only hosting
```

## Features

- Google Sign-in with a dedicated login page
- Supported-games library for Lost Cities and Sea Salt & Paper
- Official 2-player, 3-round Lost Cities score sheet
- Sea Salt & Paper round table for 2–4 players with automatic totals
- Automatic expedition scoring, including investment multipliers and the 8-card +20 bonus
- Immutable completed-game history under the signed-in user's private `users/{uid}/games` collection

### Lost Cities scoring

For each started expedition, the calculator uses `(number-card total - 20) × (1 + investments)`, then adds 20 if the expedition contains at least 8 total cards. An untouched expedition scores 0. Match totals sum all 3 rounds; the highest total wins and equal totals are saved as a tie.

The rule implementation was cross-checked using [UltraBoardGames' rule summary](https://www.ultraboardgames.com/lost-cities/game-rules.php). The publisher PDF could not be retrieved automatically, so spot-checking unusual edge cases against the physical rulebook is recommended.

### Sea Salt & Paper scoring table

Sea Salt & Paper supports 2–4 players and ends when a player reaches 40 (2 players), 35 (3 players), or 30 points (4 players). Tied totals are resolved using the final-round score. The app stores final round scores entered by players rather than calculating individual card combinations. Rules were cross-checked against the [Board Game Arena rules summary](https://en.doc.boardgamearena.com/Gamehelpseasaltpaper).

Firestore rules allow an authenticated user to access only their own profile and immutable game history, enforce the completed-game schema, and validate round totals and the winner. Treat these prototype rules as requiring review before broad public release.
