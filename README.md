Lightning Flow Scanner (sfdx plug-in)
=====================

![screenshot results(https://raw.githubusercontent.com/RubenHalman/Force-Flow-Control/master/docs/scanresults.png)](https://raw.githubusercontent.com/Force-Config-Control/lightning-flow-scanner-sfdx/master/.images/results.png)

## Installation:

npm:
```sh-session
$ npm install -g lightning-flow-scanner
```

sfdx:
```sh-session
$ sfdx plugins:install lightning-flow-scanner
```

## Using the scanner:

```
USAGE
  $ sfdx flow:scan [--json] [--loglevel <level>] [-s] [-u <targetusername>]

OPTIONS
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)                                    [default: warn] logging level

  -s, --silent                                                                      won't throw errors if violations are found.

  -u, --targetusername                                                              will retrieve metadata from an org before scan
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

See code: [src/commands/flow/scan.ts](https://github.com/Force-Config-Control/lightning-flow-scanner-sfdx/blob/v0.0.18/src/commands/flow/scan.ts)
