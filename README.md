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
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g lightning-flow-scanner-cli
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
lightning-flow-scanner-cli/0.0.15 darwin-x64 node-v14.16.1
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx scan:scan [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-scanflows---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx scan:scan [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Fix the following issues:

```
Fix the following issues:

USAGE
  $ sfdx scan:scan [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [src/commands/scan/scants](https://github.com/Force-Config-Control/lightning-flow-scanner-cli/blob/v0.0.15/src/commands/scan/flows.ts)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
