import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as core from 'flowhealthcheck--core/out';
import { Flow } from 'flowhealthcheck--core/out/main/models/Flow';
import { ScanOptions } from 'flowhealthcheck--core/out/main/models/ScanOptions';
import missingFaultPaths = require('./main-example.json');

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('flowhealthcheck-cli', 'command');

export default class Lint extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = true;
  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    // todo use project
    // this.project.

    const aFlow = new Flow({
      label: 'main',
      path: 'anypath',
      xmldata : missingFaultPaths
    });

    const scannedFlows = core.scan([aFlow], new ScanOptions(true, true, true, true, true, true, true, true));
    const outputString = 'Missing Description Results \'aFlow\' = ' + scannedFlows[0].scanResults[3].resultCount;

    this.ux.log(outputString);

    // Return an object to be displayed with --json
    return { outputString };
  }
}
