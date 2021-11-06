import {SfdxCommand, flags} from '@salesforce/command';
import {fs, Messages, SfdxError, SfdxProject} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
import * as core from 'lightning-flow-scanner-core/out';
import {Flow} from 'lightning-flow-scanner-core/out/main/models/Flow';
import {ScanResult} from 'lightning-flow-scanner-core/out/main/models/ScanResult';
import * as path from 'path';
import {FindFlows} from '../../libs/FindFlows';
import {ParseFlows} from '../../libs/ParseFlows';
import {Violation} from '../../models/Violation';
import {ScannerOptions} from 'lightning-flow-scanner-core/out/main/models/ScannerOptions';
import {Override} from "lightning-flow-scanner-core/out/main/models/Override";
import {FlowScanOverrides} from "lightning-flow-scanner-core/out/main/models/FlowScanOverrides";
import * as chalk from "chalk";
import { exec } from 'child_process';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('lightning-flow-scanner', 'command');

export default class scan extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;
  protected static supportsUsername = true;

  public rootPath;

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
    })
  };

  public async run(): Promise<AnyJson> {
    this.rootPath = await SfdxProject.resolveProjectPath();

    // username provided
    let errored = false;
    if(this.flags.targetusername){
      this.ux.startSpinner(chalk.yellowBright('Retrieving Metadata...'));
      const retrieveCommand = `sfdx force:source:retrieve -m Flow -u"${
        this.flags.targetusername
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
    }
    if(errored){
      throw new SfdxError(messages.getMessage('errorRetrievingMetadata'), '', [], 1);
    } else {
      this.ux.stopSpinner(
        chalk.greenBright('Retrieve Completed ✔.')
      );
    }

    let flowFiles;
    if(this.flags.directory){
      flowFiles = FindFlows(this.flags.directory);
    } else {
      flowFiles = FindFlows(this.rootPath);
    }
    const pathToIgnoreFile = path.join(this.rootPath, '.flowscanignore');
    let ruleOptions;
    if (pathToIgnoreFile) {
      ruleOptions = this.createScannerOptions(pathToIgnoreFile);
    }
    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    let scanResults: ScanResult[];
    if (ruleOptions) {
      scanResults = core.scan(parsedFlows, ruleOptions);
    } else {
      scanResults = core.scan(parsedFlows);
    }

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
    let totalFlows = scanResults.length;
    let results = lintResults.length;
    const summary = {totalFlows, results};
    const errors = lintResults;
    this.ux.logJson(results > 0 ? {summary, errors} : {summary});

    if (!this.flags.silent && lintResults.length > 0) {
      let labels: string[] = [];
      for (const lintResult of lintResults) {
        if (!labels.includes(lintResult.flowName)) {
          labels.push(lintResult.flowName);
        }
      }
      throw new SfdxError(messages.getMessage('commandDescription'), 'results', labels, 1);
    }

    return 0;
  }

  private createScannerOptions(pathToIgnoreFile): ScannerOptions {

    try {
      const ignoreFile = fs.readJsonSync(pathToIgnoreFile);
      let rules = ignoreFile['activeRules'];
      let flowScanOverrides = [];
      if (ignoreFile['overrides']) {
        for (let override of ignoreFile['overrides']) {
          let overrides = [];
          if (override['results']) {
            for (let result of override['results']) {
              overrides.push(new Override(result.ruleName, result.result));
            }
            flowScanOverrides.push(new FlowScanOverrides(override.flowName, overrides));
          }
        }
      }
      return new ScannerOptions(rules, flowScanOverrides);
    } catch (e) {

    }
  }

}
