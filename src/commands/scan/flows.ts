import {SfdxCommand} from '@salesforce/command';
import {fs, Messages, SfdxError, SfdxProject} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
import * as core from 'lightningflowscan-core/out';
import {Flow} from 'lightningflowscan-core/out/main/models/Flow';
import {ScanResult} from 'lightningflowscan-core/out/main/models/ScanResult';
import {Violation} from '../../models/Violation';
import {FindFlows} from "../../libs/FindFlows";
import {ParseFlows} from "../../libs/ParseFlows";
import * as path from 'path';
import {IgnoredFlowViolations} from "../../models/IgnoredFlowViolations";
import {IgnoredRuleViolationsInFlows} from "../../models/IgnoredRuleViolationsInFlows";

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('lightningflowscan-cli', 'command');

export default class flows extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public ignoredFlowViolations: IgnoredFlowViolations;
  public ignoredRuleViolationsInFlows: IgnoredRuleViolationsInFlows;

  public async run(): Promise<AnyJson> {

    const aPath = await SfdxProject.resolveProjectPath();
    const flowFiles = FindFlows(aPath);

    // todo ugly code
    // if ignore file found, populate this.ignoredFlowViolations & this.ignoredRuleViolationsInFlows
    const pathToIgnoreFile = path.join(aPath, 'flows.scanignore.json');
    if(pathToIgnoreFile){
      this.createIgnoreViolations(pathToIgnoreFile);
    }

    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    const scanResults: ScanResult[] = core.Scan(parsedFlows);
    const lintResults: Violation[] = [];
    for (const scanResult of scanResults) {
      for (const ruleResult of scanResult.ruleResults) {
        if (ruleResult.results.length > 0) {
          if (this.ignoredFlowViolations && this.ignoredFlowViolations.flowlabels.length > 0 && this.ignoredFlowViolations.flowlabels.find(violation => {
            return (violation == scanResult.flow.label);
          })) {
            continue;
          } else if (this.ignoredRuleViolationsInFlows && this.ignoredRuleViolationsInFlows.ignoredRuleViolationsInFlows.length > 0 && this.ignoredRuleViolationsInFlows.ignoredRuleViolationsInFlows.find(violation => {
            if (violation && violation.flowname && violation.rulename) {
              return (violation.flowname == scanResult.flow.label && violation.rulename == ruleResult.ruleLabel);
            }
          })) {
            continue;
          } else {
            lintResults.push(
              new Violation(
                scanResult.flow.label,
                ruleResult.ruleLabel,
                ruleResult.ruleDescription,
                ruleResult.results.length
              )
            );
          }
        }
      }
    }
    if (lintResults.length > 0) {
      const warnings: string[] = [];
      for (const lintResult of lintResults) {
        warnings.push('in Flow \'' + lintResult.flowlabel + '\', Rule:\'' + lintResult.ruleLabel + '\' is violated ' + lintResult.numberOfViolations + ' times');
      }
      throw new SfdxError(messages.getMessage('commandDescription'), 'results', warnings, 1);
    }
    // If there are no lintresults
    return 0;
  }

  private createIgnoreViolations(pathToIgnoreFile) {

    let foundPath;
    if (fs.existsSync(pathToIgnoreFile)) {
      foundPath = fs.readJsonSync(pathToIgnoreFile);
    }
    try {
      let ignoredFlows = foundPath['flowsToBeIgnored'];
      this.ignoredFlowViolations = new IgnoredFlowViolations(ignoredFlows);
      let ignoredRulesInFlows = foundPath['rulesToBeIgnoredInFlows'];
      this.ignoredRuleViolationsInFlows = new IgnoredRuleViolationsInFlows(ignoredRulesInFlows);
    } catch (e) {

    }

    return
  }

}
