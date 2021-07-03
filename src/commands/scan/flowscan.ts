import {SfdxCommand} from '@salesforce/command';
import {Messages, SfdxError, SfdxProject} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
import * as core from 'lightningflowscan-core/out';
import {Flow} from 'lightningflowscan-core/out/main/models/Flow';
import {ScanResult} from 'lightningflowscan-core/out/main/models/ScanResult';
import { Violation } from '../../models/Violation';
import {FindFlows} from "../../libs/FindFlows";
import {ParseFlows} from "../../libs/ParseFlows";

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('flowhealthcheck-cli', 'command');

export default class flowscan extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {

    const path = await SfdxProject.resolveProjectPath();
    const flowFiles = FindFlows(path);
    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    const scanResults: ScanResult[] = core.scan(parsedFlows);
    const lintResults: Violation[] = [];
    for (const scanResult of scanResults) {
      for (const ruleResult of scanResult.ruleResults) {
        if (ruleResult.results.length > 0) {
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

    if (lintResults.length > 0) {
      const warnings : string[] = [];
      for(const lintResult of lintResults){
        warnings.push('in Flow \'' + lintResult.label + '\', Rule:\''+lintResult.ruleLabel +'\' is violated '  + lintResult.numberOfViolations + ' times');
      }

      throw new SfdxError(messages.getMessage('commandDescription'), 'results',
        warnings, 1);
    }
    // If there are no lintresults
    return 0;
  }
}
