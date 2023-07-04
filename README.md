Lightning Flow Scanner (sfdx plug-in)
=====================

![screenshot results(https://raw.githubusercontent.com/RubenHalman/Force-Flow-Control/master/docs/scanresults.png)](https://raw.githubusercontent.com/Force-Config-Control/lightning-flow-scanner-sfdx/master/.images/results.png)

## Installation:

NPM:
```sh-session
$ npm install -g lightning-flow-scanner
```

SFDX:
```sh-session
$ sfdx plugins:install lightning-flow-scanner
```

## Usage:

```
  $ sfdx flow:scan [-c <path>] [-d <directory>] [-e] [-p <path>][-u <targetusername>] [--json] [--loglevel <level>]
```

### Options
```
  -c, --config <path>                                               provide a path to the configuration file.

  -d, --directory <C:\..\force-app\main\default\flows>              provide a directory to scan.

  -e, --throwerrors                                                 set scan to throw an error if a violation is found.

  -p, --sourcepath <C:\..\flow1.flow, C:\..\flow2.flow>             provide a comma-separated list of flow paths to scan.

  -u, --targetusername <username>                                   retrieve the latest metadata from the target before the scan.

  --json                                                            set output format as json.

  --loglevel=(trace|debug|info|warn|error|fatal)                    [default: warn] logging level.

```

### Configuration file:
Create a _.Create a _.flow-scanner.json_ file to:
 - define the severity of rule violations. 
 - specify any exceptions to ignore in the scan.

#### Defining the severity of a rule
Define the severity per rule as shown in the following example. If not provided the severity is 'error' by default.
```
{
  "rules": [
    {
      "MissingFlowDescription":{
        "severity": "warning"
      }
    }
  ]
}
```

#### Specifying an exception
Specify exceptions by flow, rule and result(s), as shown in the following example.
```
{
  "exceptions": [
    {
      "GetAccounts": [
        {"UnusedVariables":["somecount"]}
      ]
    }
  ]
}
```

### Included Rules

[Standard Ruleset](https://github.com/Force-Config-Control/lightning-flow-scanner-core)
