lightning-flow-scanner-cli
=====================

[![Version](https://img.shields.io/npm/v/lightning-flow-scanner-cli.svg)](https://npmjs.org/package/lightning-flow-scanner-cli)
[![CircleCI](https://circleci.com/gh/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git/tree/master.svg?style=shield)](https://circleci.com/gh/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/lightning-flow-scanner-cli.git/branch/master)
[![Codecov](https://codecov.io/gh/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git/branch/master/graph/badge.svg)](https://codecov.io/gh/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git)
[![Greenkeeper](https://badges.greenkeeper.io/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git/badge.svg)](https://snyk.io/test/github/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git)
[![Downloads/week](https://img.shields.io/npm/dw/lightning-flow-scanner-cli.svg)](https://npmjs.org/package/lightning-flow-scanner-cli)
[![License](https://img.shields.io/npm/l/lightning-flow-scanner-cli.svg)](https://github.com/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git/blob/master/package.json)

<!-- toc -->

<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g lightning-flow-scanner-cli
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
lightning-flow-scanner-cli/0.0.18 darwin-x64 node-v16.1.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx flow:scan [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-flowscan---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx flow:scan [--json] [--silent] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

```
Fix the following flows:

USAGE
  $ sfdx flow:scan [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --silent                                                                          will not throw errors

```


## .flowscanignore
Use a .flowscanignore file to:

 - activeRules
 
 select a limited set of rules to run.
    
 - overrides
 
 specify results to ignore.

```
{
  "activeRules": [
    "DMLStatementInLoop",
    "DuplicateDMLOperationsByNavigation",
    "HardcodedIds"
  ],
  "overrides": [
      {
          "flowName": "Create Property",
          "results": [{
              "ruleName" : "DuplicateDMLOperationsByNavigation",
              "result":"error_creating_records"
          },
          {
            "ruleName" : "DuplicateDMLOperationsByNavigation",
            "result":"upload_picture"
        }]
      }
  ]
}
```




_See code: [src/commands/flow/scan.ts](https://github.com/Force-Config-Control/lightning-flow-scanner-cli/blob/v0.0.18/src/commands/flow/scan.ts)_
<!-- commandsstop -->
