Lightning Flow Scanner (sfdx plug-in)
=====================

[![Version](https://img.shields.io/npm/v/lightning-flow-scanner-cli.svg)](https://npmjs.org/package/lightning-flow-scanner-cli)
[![Downloads/week](https://img.shields.io/npm/dw/lightning-flow-scanner-cli.svg)](https://npmjs.org/package/lightning-flow-scanner-cli)
[![License](https://img.shields.io/npm/l/lightning-flow-scanner-cli.svg)](https://github.com/https://github.com/Force-Config-Control/lightning-flow-scanner-cli.git/blob/master/package.json)

### _Find and Fix bugs in Lightning Flows of your Salesforce Projects._

![screenshot results(https://raw.githubusercontent.com/RubenHalman/Force-Flow-Control/master/docs/scanresults.png)](https://raw.githubusercontent.com/Force-Config-Control/lightning-flow-scanner-cli/master/.images/results.png)

## Installation:

npm:
```sh-session
$ npm install -g lightning-flow-scanner-cli
```

sfdx:
```sh-session
sfdx plugins:install lightning-flow-scanner-cli
```

## Using the scanner:

```
USAGE
  $ sfdx flow:scan [--json] [--targetusername] [--silent] [--loglevel]

OPTIONS
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level

  -s, --silent                                                                      won't throw errors if violations are found.

  -u, --targetusername                                                              will retrieve metadata from an org before scan
~~~~
```

## Optional configurations:
Use a _.flowscanignore_ file to:

 - activeRules
 
 select a limited set of rules to run.
    
 - overrides
 
 specify results to ignore. Specify by ruleName and result(if applicable), like shown in the example.

#### Example .flowscanignore:
```
{
  "activeRules": [
    "DMLStatementInLoop",
    "DuplicateDMLOperationsByNavigation",
    "MissingFlowDescription",
    "HardcodedIds"
  ],
  "overrides": [
    {
      "flowName": "Create Property",
      "results": [
        {
          "ruleName": "DuplicateDMLOperationsByNavigation",
          "result": "error_creating_records"
        },
        {
          "ruleName": "DuplicateDMLOperationsByNavigation",
          "result": "upload_picture"
        }
      ]
    },
    {
      "flowName": "mainflow",
      "results": [
        {
          "ruleName": "MissingFlowDescription"
        }
      ]
    }
  ]
}
```

See code: [src/commands/flow/scan.ts](https://github.com/Force-Config-Control/lightning-flow-scanner-cli/blob/v0.0.18/src/commands/flow/scan.ts)
