import { SfdxCommand, flags } from "@salesforce/command";
import { Messages, SfdxError } from "@salesforce/core";
import * as core from "lightning-flow-scanner-core/out";
import * as fs from "fs-extra";
import { Flow } from "lightning-flow-scanner-core/out/main/models/Flow";
import { ScanResult } from "lightning-flow-scanner-core/out/main/models/ScanResult";
import { FindFlows } from "../../libs/FindFlows";
import { ParseFlows } from "../../libs/ParseFlows";
import { Violation } from "../../models/Violation";
import * as c from "chalk";
import { exec } from "child_process";
import { cosmiconfig } from "cosmiconfig";

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages("lightning-flow-scanner", "command");

export default class scan extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;
  protected static supportsUsername = true;

  protected userConfig;

  protected static flagsConfig = {
    directory: flags.filepath({
      char: "d",
      description: messages.getMessage("directoryToScan"),
      required: false,
    }),
    config: flags.filepath({
      char: "c",
      description: "Path to configuration file",
      required: false,
    }),
    retrieve: flags.boolean({
      char: "r",
      description: "Force retrieve Flows from org at the start of the command",
      default: false,
    }),
    sourcepath: flags.filepath({
      char: "p",
      description: "comma-separated list of source flow paths to scan",
      required: false,
    }),
  };

  public async run(): Promise<{
    status: number,
    summary: {
      flows: number;
      errors: number;
      message: string;
    };
    results: Violation[];
  }> {
    this.ux.startSpinner('Starting Flow Scanner');
    // Load user options
    await this.loadScannerOptions(this.flags.config);

    // Retrieve flows from org if target has been provided
    if (this.flags.targetusername) {
      await this.retrieveFlowsFromOrg();
    }

    // List flows that will be scanned
    let flowFiles;
    if (this.flags.directory && this.flags.sourcepath) {
      this.ux.stopSpinner("Error");
      throw new SfdxError(
        "You can only specify one of either directory or sourcepath, not both."
      );
    } else if (this.flags.directory) {
      flowFiles = FindFlows(this.flags.directory);
    } else if (this.flags.sourcepath) {
      flowFiles = this.flags.sourcepath
        .split(",")
        .filter((f) => fs.existsSync(f));
    } else {
      flowFiles = FindFlows(".");
    }
    this.ux.startSpinner(`Found ${flowFiles.length} flows to analyze`);

    // Perform scan
    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    this.ux.startSpinner(`Parsed ${flowFiles.length} flows, processing analysis`);
    let scanResults: ScanResult[];
    if (this.userConfig && Object.keys(this.userConfig).length > 0) {
      scanResults = core.scan(parsedFlows, this.userConfig);
    } else {
      scanResults = core.scan(parsedFlows);
    }
    this.ux.stopSpinner(`Completed analysis of ${flowFiles.length} flows`);

    // Build result
    const errors: Violation[] = [];
    for (const scanResult of scanResults) {
      for (const ruleResult of scanResult.ruleResults) {
        if (ruleResult.details && ruleResult.details.length > 0) {
          for (const result of ruleResult.details) {
            errors.push(
              new Violation(
                scanResult.flow.label[0],
                ruleResult.ruleName,
                ruleResult.ruleDescription,
                'warning',
                {
                  name: result.name,
                  type: result.subtype,
                }
              )
            );
          }
        } else {
          if (!ruleResult.details && ruleResult.occurs) {
            errors.push(
              new Violation(
                scanResult.flow.label[0],
                ruleResult.ruleName,
                ruleResult.ruleDescription,
                'warning',
              )
            );
          }
        }
      }
    }
    const flows = scanResults.length;
    const errornr = errors.length;
    const message =
      "A total of " +
      errors.length +
      " errors have been found in " +
      flows +
      " flows.";
    const summary = { flows, errors: errornr, message };
    this.ux.styledHeader(summary.message);
    let status = 0;
    if (errors.length > 0) {
      status = 1;
      const lintResultsOrdered = {};
      // Group issues by flow
      for (const errorDtl of errors) {
        lintResultsOrdered[errorDtl.flowName] = lintResultsOrdered[errorDtl.flowName] || [];
        lintResultsOrdered[errorDtl.flowName].push(errorDtl);
      }
      // Display issues
      for (const lintResultKey in lintResultsOrdered) {
        const lintResultFlow = lintResultsOrdered[lintResultKey];
        this.ux.log(`${c.blue(c.bold(lintResultKey))}`)
        this.ux.log('');
        for (const lintResult of lintResultFlow) {
          this.ux.log(`${c.yellow(lintResult.severity.toUpperCase() + ' ' + c.bold(lintResult.ruleName))}`);
          if (lintResult.details) {
            this.ux.log(c.italic(`Details: ${lintResult.details.name}, ${lintResult.details.type}`));
          }
          this.ux.log(c.italic(lintResult.description))
          this.ux.log('');
        }
      }
    }
    // Set status code = 1 if there are errors, that will make cli exit with code 1 when not in --json mode
    return { summary, status: status, results: errors };
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
      `.flow-scanner`,
    ];
    const explorer = cosmiconfig(moduleName, {
      searchPlaces,
    });
    if (forcedConfigFile) {
      // Forced config file name
      const explorerLoadRes = await explorer.load(forcedConfigFile);
      this.userConfig = explorerLoadRes?.config ?? {};
    } else {
      // Let cosmiconfig look for a config file
      const explorerSearchRes = await explorer.search();
      this.userConfig = explorerSearchRes?.config ?? {};
    }

  }

  // Use sfdx to retrieve flows from remote org
  private async retrieveFlowsFromOrg() {
    let errored = false;
    this.ux.startSpinner(c.yellowBright("Retrieving Metadata..."));
    const retrieveCommand = `sfdx force:source:retrieve -m Flow -u "${this.flags.targetusername}"`;
    try {
      await exec(retrieveCommand, {
        maxBuffer: 1000000 * 1024,
      });
    } catch (exception) {
      errored = true;
      this.ux.errorJson(exception);
      this.ux.stopSpinner(c.redBright("Retrieve Operation Failed."));
    }
    if (errored) {
      throw new SfdxError(
        messages.getMessage("errorRetrievingMetadata"),
        "",
        [],
        1
      );
    } else {
      this.ux.stopSpinner(c.greenBright("Retrieve Completed ✔."));
    }
  }
}
