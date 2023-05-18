import { SfdxCommand, flags } from '@salesforce/command';
import { Messages, SfdxError, SfdxProject } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as core from 'lightning-flow-scanner-core/out';
import * as fs from 'fs-extra'; 
import { Flow } from 'lightning-flow-scanner-core/out/main/models/Flow';
import { ScanResult } from 'lightning-flow-scanner-core/out/main/models/ScanResult';
import { FindFlows } from '../../libs/FindFlows';
import { ParseFlows } from '../../libs/ParseFlows';
import { Violation } from '../../models/Violation';
import { ScannerOptions } from 'lightning-flow-scanner-core/out/main/models/ScannerOptions';
import { Override } from "lightning-flow-scanner-core/out/main/models/Override";
import { FlowScanOverrides } from "lightning-flow-scanner-core/out/main/models/FlowScanOverrides";
import * as chalk from "chalk";
import { exec } from 'child_process';
import { cosmiconfig } from 'cosmiconfig';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('lightning-flow-scanner', 'command');

export default class scan extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;
  protected static supportsUsername = true;

  public rootPath;
  protected userConfig;
  protected scannerOptions: ScannerOptions;

  protected static flagsConfig = {
    help: flags.help({ char: 'h' }),
    silent: flags.boolean({
      char: 's',
      description: messages.getMessage('noErrors')
    }),
    directory: flags.filepath({
      char: 'd',
      description: messages.getMessage('directoryToScan'),
      required: false
    }),
    config: flags.filepath({
      char: 'c',
      description: "Path to configuration file",
      required: false
    }),
    retrieve: flags.boolean({
      char: 'r',
      description: "Force retrieve Flows from org at the start of the command",
      default: false
    }),
    sourcepath: flags.filepath({
      char: 'p',
      description: 'comma-separated list of source flow paths to scan',
      required: false
    })
  };

  public async run(): Promise<AnyJson> {
    this.rootPath = await SfdxProject.resolveProjectPath();

    // Load user options
    await this.loadScannerOptions(this.flags.config);

    // Retrieve flows from org if necessary
    if (this.flags.retrieve) {
      await this.retrieveFlowsFromOrg();
    }

    // List flows that will be scanned
    let flowFiles;
    if (this.flags.directory && this.flags.sourcepath) {
      throw new SfdxError('You can only specify one of either directory or sourcepath, not both.');
    }
    if (this.flags.directory) {
      flowFiles = FindFlows(this.flags.directory);
    } else if (this.flags.sourcepath) {
      flowFiles = this.flags.sourcepath.split(',').filter(f => fs.existsSync(f));
    } else {
      flowFiles = FindFlows(this.rootPath);
    }

    // Perform scan
    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    let scanResults: ScanResult[];
    if (this.scannerOptions && Object.keys(this.scannerOptions).length > 0) {
      scanResults = core.scan(parsedFlows, this.scannerOptions);
    } else {
      scanResults = core.scan(parsedFlows);
    }

    // Build result
    const lintResults: Violation[] = [];
    for (const scanResult of scanResults) {
      for (const ruleResult of scanResult.ruleResults) {
        if (ruleResult.details && ruleResult.details.length > 0) {
          for (const result of ruleResult.details) {
            lintResults.push(new Violation(
              scanResult.flow.label[0],
              ruleResult.ruleName,
              ruleResult.ruleDescription,
              {
                "name": result.name,
                "type": result.subtype,
              }
            ));
          }
        } else {
          if (!ruleResult.details && ruleResult.occurs) {
            lintResults.push(new Violation(
              scanResult.flow.label[0],
              ruleResult.ruleName,
              ruleResult.ruleDescription
            ));
          }
        }
      }
    }
    const totalFlows = scanResults.length;
    const results = lintResults.length;
    const summary = { totalFlows, results };
    const errors = lintResults;
    this.ux.logJson(results > 0 ? { summary, errors } : { summary });

    if (!this.flags.silent && lintResults.length > 0) {
      const labels: string[] = [];
      for (const lintResult of lintResults) {
        if (!labels.includes(lintResult.flowName)) {
          labels.push(lintResult.flowName);
        }
      }
      throw new SfdxError(messages.getMessage('commandDescription'), 'results', labels, 1);
    }

    return 0;
  }

  // lightning flow scanner can be customized using a local config file .flow-scanner.yml
  private async loadScannerOptions(forcedConfigFile: string): Promise<void> {
    // Read config from file
    const moduleName = "flow-scanner";
    const searchPlaces = [
      "package.json",
      `.${moduleName}.yaml`,
      `.${moduleName}.yml`,
      `.${moduleName}.json`,
      `config/.${moduleName}.yaml`,
      `config/.${moduleName}.yml`,
      `.flowscanignore`];
    const explorer = await cosmiconfig("flow-scanner", {
      searchPlaces,
    });
    if (forcedConfigFile) {
      // Forced config file name
      this.userConfig = explorer.load(forcedConfigFile);
    }
    else {
      // Let cosmiconfig look for a config file
      const explorerSearchRes = await explorer.search();
      this.userConfig = explorerSearchRes.config ?? {}
    }

    // Build ScannerOptions from config file values
    const rules = this.userConfig['activeRules'];
    const flowScanOverrides = [];
    if (this.userConfig['overrides']) {
      for (const override of this.userConfig['overrides']) {
        const overrides = [];
        if (override['results']) {
          for (const result of override['results']) {
            overrides.push(new Override(result.ruleName, result.result));
          }
          flowScanOverrides.push(new FlowScanOverrides(override.flowName, overrides));
        }
      }
    }
    this.scannerOptions = new ScannerOptions(rules, flowScanOverrides);
  }

  // Use sfdx to retrieve flows from remote org
  private async retrieveFlowsFromOrg() {
    let errored = false;
    this.ux.startSpinner(chalk.yellowBright('Retrieving Metadata...'));
    const retrieveCommand = `sfdx force:source:retrieve -m Flow -u "${this.flags.targetusername
      }"`;
    // -r ./${tmpDir} -w 30 --json
    try {
      await exec(retrieveCommand, {
        maxBuffer: 1000000 * 1024
      });
    } catch (exception) {
      errored = true;
      this.ux.errorJson(exception);
      this.ux.stopSpinner(chalk.redBright('Retrieve Operation Failed.'));
    }
    if (errored) {
      throw new SfdxError(messages.getMessage('errorRetrievingMetadata'), '', [], 1);
    } else {
      this.ux.stopSpinner(
        chalk.greenBright('Retrieve Completed ✔.')
      );
    }
  }
}