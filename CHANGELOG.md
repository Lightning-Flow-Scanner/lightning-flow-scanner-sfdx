## [2.26.1](https://github.com/Lightning-Flow-Scanner/lightning-flow-scanner-sfdx/compare/v2.26.0...v2.26.1) (2024-06-15)


### Bug Fixes

* release configurations and extension on workflow ([6dc4dd2](https://github.com/Lightning-Flow-Scanner/lightning-flow-scanner-sfdx/commit/6dc4dd204f42e32c0c70590a0d7fd9d7c42d49af))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] (beta, main branch content)

- Fix wrong exit code which has to be related to --failon option (default: `error`)
- Display severity in human format results
- Automate Releases via GitHub Actions
  - From `master` branch: **beta**
  - From `alpha` branch: **alpha**
  - When a GitHub release is created: Git tag selected for the release.
- Run tests during Pull Request checks

## [2.12.0] 2023-08-29

- Fix exit code that should be 1 according to --failon value [#71](https://github.com/Force-Config-Control/lightning-flow-scanner-sfdx/issues/71)

## [2.11.0] 2023-08

Fixes:

- [False positive 'FlowDescription' rule](https://github.com/Force-Config-Control/lightning-flow-scanner-core/issues/39)
- [False positive 'MissingNullHandler' rule](https://github.com/Force-Config-Control/lightning-flow-scanner-core/issues/38)

## [2.9.0] 2023-08

- Bugfix folder scan & human output: some bugs have been fixed in 2.9 regarding including node modules in the scope of the scan and also the issues in the human output

## [2.8.0] 2023-08

New Rule: **Copy of API Name**

Having multiple elements called Copy_X_Of_Element will decrease the readability of the Flow. If you copy and paste them, make sure to update the API name of the new copy.

Configuration ID: CopyOf ([View source code](https://github.com/Force-Config-Control/lightning-flow-scanner-core/tree/master/src/main/rules/CopyOf.ts))

## [2.5.0] 2023-07

Introducing two new configurable rules!

1. Old API Version 
2. Flow Naming Convention

### 1. Old API version

Newer API components may cause older versions of Flows to start behaving incorrectly due to differences in the underlying mechanics. The Api Version has been available as an attribute on the Flow since API v50.0 and it is recommended to limit variation and to update them on a regular basis.

Default Value: `>50.0`

Configuration example:
```
APIVersion:
    {
        severity: 'error',
        expression: '===58'
    }
```

Configuration ID: `APIVersion` _([View source code](https://github.com/Force-Config-Control/lightning-flow-scanner-core/tree/master/src/main/rules/APIVersion.ts))_

### 2. Flow naming conventions

Readability of flow is very important. Agreeing on and following the same naming conventions will ease collaboration.

Default Value: `[A-Za-z0-9]+_[A-Za-z0-9]+`

Configuration example:
```
FlowName:
    {
        severity: 'error',
        expression: '[A-Za-z0-9]'
    }
```

Configuration ID: `FlowName` _([View source code](https://github.com/Force-Config-Control/lightning-flow-scanner-core/tree/master/src/main/rules/FlowName.ts))_

## [2.3.0] - 2023-07

- DuplicateDMLOperations now also returns false when the navigation of the screen after a DML has been hidden completely and not just the previous navigational button.

## [2.1.0] - 2023-07-16

- Fix npm package generation (please do not use 2.0.0 but 2.1.0)
- Upgrade lightning-flow-scanner-core dependency to 2.5.0
- Markdown formatting
- Add screenshot image at the head of the README
- Fix rules table alignment
- Add banner at the top of the README

## [2.0.0] - 2023-07-16

- **BREAKING CHANGE**: `--throwerrors` argument is not available anymore and is replaced by `--failon`, that has more options
- Update documentation in README
- Update human-readable output format
  - Sort errors by flow
- New argument **--failon** (error/warning/note): Makes return code 1 in case --failon severity is reached

## [1.1.0] - 2023-07-03

- Use [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) to load configuration
- Add a **--retrieve** argument in case user wants to retrieve flows from org before scanning
- Add a testing GitHub action Workflow 
- Add CHANGELOG.md file
- Code refactorization
  - let <=> const
  - Split main method into smaller methods
  - use fs-extra instead of sf plugin fs
  - Remove tslint (deprecated), replaced by eslint
  - Upgrade dependencies
  - Add VsCode local debugging configuration
