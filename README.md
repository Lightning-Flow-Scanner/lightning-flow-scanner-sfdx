[![Lightning Flow Scanner Banner](docs/images/banner.png)](https://github.com/Force-Config-Control/lightning-flow-scanner-sfdx)

[![Version](https://img.shields.io/npm/v/lightning-flow-scanner.svg)](https://npmjs.org/package/lightning-flow-scanner)
[![Downloads/week](https://img.shields.io/npm/dw/lightning-flow-scanner.svg)](https://npmjs.org/package/lightning-flow-scanner)
[![Downloads/total](https://img.shields.io/npm/dt/lightning-flow-scanner.svg)](https://npmjs.org/package/lightning-flow-scanner)
[![GitHub stars](https://img.shields.io/github/stars/Force-Config-Control/lightning-flow-scanner-sfdx)](https://GitHub.com/Force-Config-Control/lightning-flow-scanner-sfdx/stargazers/)
[![GitHub contributors](https://img.shields.io/github/contributors/Force-Config-Control/lightning-flow-scanner-sfdx.svg)](https://gitHub.com/Force-Config-Control/lightning-flow-scanner-sfdx/graphs/contributors/)
[![License](https://img.shields.io/npm/l/lightning-flow-scanner.svg)](https://github.com/Force-Config-Control/lightning-flow-scanner-sfdx/blob/main/package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

__*Identify potential issues and improvements in Salesforce Flows*__

![FlowScan example](docs/images/flow-scan-example.jpg)

**Also available as [VS Code Extension](https://github.com/Force-Config-Control/lightning-flow-scanner-vsce)*

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
  - [Options](#options)
  - [Examples](#examples)
- [Rule overview](#rule-overview)
- [Configuration](#configuration)
  - [Defining the severity per rule](#defining-the-severity-per-rule)
  - [Specifying an exception](#specifying-an-exception)
  - [Configuring an expression](#configuring-an-expression)

## Installation

Install with SFDX:

```sh-session
sfdx plugins:install lightning-flow-scanner
```

Install with NPM:

```sh-session
npm install -g lightning-flow-scanner
```

## Usage

```sh-session
sfdx flow:scan [options]
```

### Options

```sh-session
  -c, --config <path>                                               provide a path to the configuration file.

  -f, --failon                                                      provide a threshold level for returning status 1

  -p, --sourcepath <C:\..\flow1.flow, C:\..\flow2.flow>             provide a comma-separated list of flow paths to scan.

  -u, --targetusername <username>                                   retrieve the latest metadata from the target before the scan.

  -d, --directory <C:\..\force-app\main\default\flows>              provide a directory to scan.

  --json                                                            set output format as json.

  --loglevel=(trace|debug|info|warn|error|fatal)                    [default: warn] logging level.
```
### Examples

```sh-sessions
sfdx flow:scan
```

```sh-sessions
sfdx flow:scan --json
```

```sh-sessions
sfdx flow:scan --config path/to/.flow-scanner.json
```

## Rule overview

| Rule       | Id | Description |
|--------------|:-----:|:-----------|
| **Old API version** |  APIVersion | Newer API components may cause older versions of Flows to start behaving incorrectly due to differences in the underlying mechanics. The Api Version has been available as an attribute on the Flow since API v50.0 and it is recommended to limit variation and to update them on a regular basis. |
| **Copy of API Name** |  CopyOf | Having multiple elements called Copy_X_Of_Element will decrease the readability of the Flow. If you copy and paste them, make sure to update the API name of the new copy. |
| **DML statements in a loop** |  DMLStatementInLoop | To avoid hitting Apex governor limits, we recommend grouping all of your database changes together at the end of the flow, whether those changes create, update, or delete records. |
| **Duplicate DML operations** |  DuplicateDMLOperations | If the flow commits changes to the database or performs actions between two screens, don't let users navigate back between screen. Otherwise, the flow may perform duplicate database operations. |
| **Hardcoded Ids** | HardcodedIds | IDs are org-specific, so don’t hard-code IDs. Instead, pass them into variables when the flow starts. You can do so, for example, by using merge fields in URL parameters or by using a Get Records element. |
| **Flow naming conventions** |  FlowName | Readability of a flow is very important. Setting a naming convention for the Flow Name will improve the findability/searchability and overall consistency. It is recommended to at least provide a domain and a short description of the actions undertaken in the flow, in example Service_OrderFulfillment. |
| **Missing flow description** |  FlowDescription | Descriptions are useful for documentation purposes. It is recommended to provide information about where it is used and what it will do. |
| **Missing error handlers** |  MissingFaultPath | Sometimes a flow doesn’t perform an operation that you configured it to do. By default, the flow shows an error message to the user and emails the admin who created the flow. However, you can control that behavior. |
| **Missing null handlers**      |  MissingNullHandler | If a Get Records operation does not find any data it will return null. Use a decision element on the operation result variable to validate that the result is not null. |
| **Unconnected elements** |  UnconnectedElements | Unconnected elements which are not being used by the Flow should be avoided to keep Flows efficient and maintainable. |
| **Unused variables**      |  UnusedVariables | Unused variables which are not being used by the Flow should be avoided to keep Flow more efficient and maintainable. |

**More information on the rules can be found in the [lfs-core module documentation](https://github.com/Force-Config-Control/lightning-flow-scanner-core).**

## Configuration

Create a .flow-scanner.json file in order to configure:
 - The severity of violating any specific rule.
 - Any known exceptions that should be ignored during scanning.

```json
{
    "rules": {
        ...
    },
    "exceptions": {
        ...
    }
}
```

_Note: if you prefer YAML format, you can create a `.flow-scanner.yml` file using the same format._

### Defining the severity per rule

When the severity is not provided it will be `error` by default. Other available values for severity are `warning` and `note`. Define the severity per rule as shown in the following example. 

```json
{
  "rules": {
    "FlowDescription": {
      "severity": "warning"
    },
    "UnusedVariables": {
      "severity": "error"
    }
  }
}
```
### Specifying an exception

Specifying exceptions can be done by flow, rule and result(s), as shown in the following example.

```json
{
  "exceptions": {
    "AssignTaskOwner": {
      "UnusedVariables": [
        "somecount"
      ]
    },
    "GetAccounts":{
      "UnusedVariables": [
        "incvar"
      ]
    }
  }
}
```
### Configuring an expression

Some rules have additional attributes to configure, such as the expression, that will overwrite default values. These can be configured in the same way as severity as shown in the following example.

```json
{
  "rules": {
    "APIVersion":
    {
        "severity": "error",
        "expression": "===58"
    },
    "FlowName":
    {
        "severity": "error",
        "expression": "[A-Za-z0-9]"
    }
  }
}
```
