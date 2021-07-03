import {flags, SfdxCommand} from '@salesforce/command';
import {Messages, SfdxError} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
import * as core from 'lightningflowscan-core/out';
import {Flow} from 'lightningflowscan-core/out/main/models/Flow';
import {ScanResult} from 'lightningflowscan-core/out/main/models/ScanResult';
import missingFaultPaths = require('./main-example.json');
import { Violation } from '../../models/Violation';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('flowhealthcheck-cli', 'command');

export default class flowscan extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = true;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    // todo fetch flows from project (this.project)
    const aFlow = new Flow({
      label: 'main',
      path: 'anypath',
      xmldata: missingFaultPaths
    });
    const flows = [aFlow];

    const scanResults: ScanResult[] = core.scan(flows);
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
    // If no issues
    return 0;
  }
}
