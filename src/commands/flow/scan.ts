import {SfdxCommand} from '@salesforce/command';
import {fs, Messages, SfdxError, SfdxProject} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
import * as core from 'lightning-flow-scanner-core/out';
import {Flow} from 'lightning-flow-scanner-core/out/main/models/Flow';
import {ScanResult} from 'lightning-flow-scanner-core/out/main/models/ScanResult';
import * as path from 'path';
import {FindFlows} from '../../libs/FindFlows';
import {ParseFlows} from '../../libs/ParseFlows';
import {IgnoredFlowViolations} from '../../models/IgnoredFlowViolations';
import {IgnoredRuleViolationsInFlows} from '../../models/IgnoredRuleViolationsInFlows';
import {Violation} from '../../models/Violation';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('lightning-flow-scanner-cli', 'command');

export default class scan extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public ignoredFlowViolations: IgnoredFlowViolations;
  public ignoredRuleViolationsInFlows: IgnoredRuleViolationsInFlows;

  public async run(): Promise<AnyJson> {

    const aPath = await SfdxProject.resolveProjectPath();
    const flowFiles = FindFlows(aPath);

    // if ignore file found, populate this.ignoredFlowViolations & this.ignoredRuleViolationsInFlows
    const pathToIgnoreFile = path.join(aPath, 'scan.scanignore.json');
    if(pathToIgnoreFile){
      this.createIgnoreViolations(pathToIgnoreFile);
    }

    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    const scanResults: ScanResult[] = core.scan(parsedFlows);
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
            for (const result of ruleResult.results) {
              lintResults.push(new Violation(
                scanResult.flow.label[0],
                ruleResult.ruleLabel,
                ruleResult.ruleDescription,
                result.element? result.element : result
              ));
            }
          }
        }
      }
    }
    let totalFlows = scanResults.length;
    let totalResults = lintResults.length;
    const summary = { totalFlows, totalResults};
    const errors = lintResults;
    this.ux.logJson(totalResults > 0 ? {summary, errors} : {summary});
    if (lintResults.length > 0) {
      let labels: string[] = [];
      for (const lintResult of lintResults) {
        if(!labels.includes(lintResult.flowlabel)){
          labels.push(lintResult.flowlabel);
        };
      }
      throw new SfdxError(messages.getMessage('commandDescription'), 'results', labels, 1);
    }

    return 0;
  }

  private createIgnoreViolations(pathToIgnoreFile) {

    let foundPath;
    if (fs.existsSync(pathToIgnoreFile)) {
      foundPath = fs.readJsonSync(pathToIgnoreFile);
    }
    try {
      const ignoredFlows = foundPath['flowsToBeIgnored'];
      this.ignoredFlowViolations = new IgnoredFlowViolations(ignoredFlows);
      const ignoredRulesInFlows = foundPath['rulesToBeIgnoredInFlows'];
      this.ignoredRuleViolationsInFlows = new IgnoredRuleViolationsInFlows(ignoredRulesInFlows);
    } catch (e) {

    }

    return;
  }

}
