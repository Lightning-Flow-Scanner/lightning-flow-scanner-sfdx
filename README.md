# Lightning Flow Scanner(SFDX Plugin)
#### *Identify potential issues and improvements in Salesforce Flows*.
[![Version](https://img.shields.io/npm/v/lightning-flow-scanner.svg)](https://npmjs.org/package/lightning-flow-scanner)[![Downloads/week](https://img.shields.io/npm/dw/lightning-flow-scanner.svg)](https://npmjs.org/package/lightning-flow-scanner)[![Downloads/total](https://img.shields.io/npm/dt/lightning-flow-scanner.svg)](https://npmjs.org/package/lightning-flow-scanner)[![GitHub stars](https://img.shields.io/github/stars/Force-Config-Control/lightning-flow-scanner-sfdx)](https://GitHub.com/Force-Config-Control/lightning-flow-scanner-sfdx/stargazers/)[![GitHub contributors](https://img.shields.io/github/contributors/Force-Config-Control/lightning-flow-scanner-sfdx.svg)](https://gitHub.com/Force-Config-Control/lightning-flow-scanner-sfdx/graphs/contributors/)[![License](https://img.shields.io/npm/l/lightning-flow-scanner.svg)](https://github.com/Force-Config-Control/lightning-flow-scanner-sfdx/blob/main/package.json)
## Table of contents
- [Installation](#installation)
- [Usage](#usage)
  - [Options](#options)
  - [Examples](#examples)
- [Flow Rules](#rules)
- [Configuration](#configuration)
  - [Defining the severity per rule](#defining-the-severity-per-rule)
  - [Specifying an exception](#specifying-an-exception)

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
## Flow Rules
<!-- todo table -->
## Configuration
Create a .flow-scanner.json file in order to configure:
 - The severity of violating any specific rule.
 - Any known exceptions that should be ignored during scanning.
```json
{
    "rules": [
        ...
    ],
    "exceptions": [
        ...
    ]
}
```
_Note: if you prefer YAML format, you can create a `.flow-scanner.yml` file using the same format._
### Defining the severity per rule
When the severity is not provided it will be `error` by default. Other available values for severity are `warning` and `note`. Define the severity per rule as shown in the following example. 
```json
{
    "rules": [
        {
            "MissingFlowDescription": {
                "severity": "warning"
            }
        }
    ]
}
```
### Specifying an exception
Specifying exceptions can be done by flow, rule and result(s), as shown in the following example.
```json
{
    "exceptions": [
        {
            "GetAccounts": [
                {
                    "UnusedVariables": [
                        "somecount"
                    ]
                }
            ]
        }
    ]
}
```