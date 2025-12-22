# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Implement i18n with [lingui](https://lingui.dev).
- Localize wikidata interests.
- Add popover to interests.
- Add lint-staged with husky pre-commit hook.
- Add i18n to profile description.
- Add i18n to accommodation description.
- Show version and commit hash on homepage.
- Setup e2e tests with Playwright.
- Add and deploy Vitepress documentation
- Add support for [Contributors list](./README.md#contributors-) using [all-contributors](https://github.com/all-contributors/all-contributors) specification

### Changed

- Enable `noUncheckedIndexedAccess` in tsconfig to improve type safety when accessing array and object properties.
- **BREAKING_CHANGE**: Implement messages according to https://solid.github.io/chat/. The legacy format is available for read-only.

### Removed

- **BREAKING_CHANGE**: Remove support for Node v20. Node v22 is the only supported version.

### Fixed

- Fix a bug in wikidata data parsing.
- Fix tests running in firefox.
- Save preferences file during setup.
- Redirect to root after signout.
- Replace `encodeURIComponent` with `strict-uri-encode`. This may slightly change uris.

## [0.3.0] - 2025-02-19

### Added

- Add dark theme.

### Changed

- Change default dev community from [dev-sleepy-bike](https://solidweb.me/dev-sleepy-bike/community#us) to [solidcouch](https://solidweb.me/solidcouch/community#us).
- Update GitHub Actions artifact to v4 due to deprecated v3.
- Improve UX of joining.

### Deprecated

- Direct joining of community by appending membership to a group is deprecated. Use joining via [community inbox service](https://github.com/solidcouch/community-inbox) instead.

### Fixed

- Fix non-serializable value error in redux-persist.
- **BREAKING CHANGE**: Fix #122 - stop using non-standard predicate in type indexes.

### Security

- Integrate joining community via [community inbox service](https://github.com/solidcouch/community-inbox).

## [0.2.0] - 2025-01-01

### Added

- All changes until this date.

### Changed

- Start using [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## [0.1.0] - 2023-01-30

- Initialize the project with Create React App.
