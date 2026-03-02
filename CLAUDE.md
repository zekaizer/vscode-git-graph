# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Graph by luke — personal fork of hansu/vscode-git-graph (which itself is a fork of mhutchie/git-graph). VSCode extension that visualizes git repository history as a graph. Written in TypeScript with no bundler (no webpack) — uses custom Node.js build scripts instead.

## Build & Development Commands

```bash
npm run compile            # Full build: lint + clean + compile-src + compile-web
npm run compile-src        # Backend only (src/ → out/)
npm run compile-web        # Frontend only with minification (web/ → media/)
npm run compile-web-debug  # Frontend without minification (for debugging)
npm run lint               # ESLint with --max-warnings 0
npm run test               # Jest (all tests)
npm run test -- --testPathPattern="utils"  # Run single test file
npm run test-and-report-coverage           # Jest with coverage
npm run package-and-install                # Build .vsix and install locally
npm run package                            # Package .vsix with git hash injection
```

**Important**: After modifying types in `src/types.ts`, run `npm run compile-src` before compiling web — the frontend references backend types via the `GG` namespace from compiled declaration files.

## Architecture

### Two-Process Model

The extension runs in two isolated contexts that communicate via typed `postMessage`:

- **Extension Host** (`src/`) — Node.js process. Runs git commands, manages repos, handles VSCode API.
- **Webview** (`web/`) — Browser context. Renders the graph UI, handles user interaction.

### Message Protocol (`src/types.ts`)

All communication is through `RequestMessage` / `ResponseMessage` union types (60+ message types each). The webview posts a `RequestMessage`, the extension processes it and responds with a `ResponseMessage`. This file is the contract between frontend and backend.

### View Hierarchy

```
BaseGitGraphView (abstract, shared logic — message routing, repo loading, state)
├── GitGraphView        — editor tab view (WebviewPanel, singleton)
└── GitGraphPanelView   — sidebar/panel view (WebviewViewProvider)
```

### Key Backend Files

- `dataSource.ts` — Executes and parses git commands (largest file, ~2200 LOC)
- `repoManager.ts` — Repository discovery and management
- `config.ts` — Extension settings (maps VSCode config to typed objects)
- `extensionState.ts` — Persistent state (globalState/workspaceState wrappers)
- `commands.ts` — Git operation command handlers

### Frontend Build

The web build (`package-web.js`) concatenates all compiled JS files in dependency order (`utils.js` first, `main.js` last), wraps in an IIFE, and minifies with UglifyJS. No module system — `web/tsconfig.json` sets `"module": "none"`.

## Code Style

- **Indentation**: tabs
- **Quotes**: single
- **Line endings**: CRLF (Windows style — enforced by ESLint)
- **Semicolons**: required
- **Class names**: StrictPascalCase
- **Function names**: camelCase
- **Member accessibility**: explicit (except constructors/accessors)
- **Format**: Use VSCode "Format Document" to match style

## Testing

Jest with ts-jest. Tests live in `tests/` and cover backend only (`src/`). Test files follow `*.test.ts` naming. Tests mock the VSCode API extensively.

**Performance note**: Full `npm run test` takes ~260s due to `dataSource.test.ts` (294 tests, many with 5s timeouts). Use targeted test commands for faster iteration:

```bash
# Run a single test file
npx jest --no-coverage --testPathPattern="dataSource"

# Run tests matching a name pattern (fastest — <2s)
npx jest --no-coverage --testPathPattern="dataSource" -t "Should return the commits"

# Run with early exit on failure
npx jest --no-coverage --testPathPattern="dataSource" -t "stash" --bail 3

# Common test groups for dataSource.ts changes:
#   -t "Should return the commits"   → getCommits() 관련 20개
#   -t "stash"                       → stash 관련 29개
#   -t "Should return the repository" → getRepoInfo() 관련
```

**Known issue**: Running the full dataSource suite causes 67 timeout failures (stash/diff/spawn tests) due to test isolation issues. These pass individually. Use `-t` pattern matching to validate specific areas.

## Fork Setup

### Remotes

- `origin` — zekaizer/vscode-git-graph (personal fork)
- `upstream` — hansu/vscode-git-graph (upstream)

### Branches

- `by-luke` — personal customization branch (default). All features merge here.
- `master` — upstream sync only. No direct commits.
- `feat-*` — individual feature branches, merge into by-luke.

### Package Identity

- **name**: `git-graph-by-luke`
- **displayName**: `Git Graph by luke`
- **publisher**: `zekaizer`
- **Extension ID**: `zekaizer.git-graph-by-luke`

### Versioning

Upstream version is kept as-is. Build revision is tracked via git commit hash injected into description at package time (see `.vscode/package-vsix.js`).
