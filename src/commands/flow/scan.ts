import { SfdxCommand, flags } from "@salesforce/command";
import { Messages, SfdxError, SfdxProject } from "@salesforce/core";
import * as core from "lightning-flow-scanner-core/out";
import * as fs from "fs-extra";
import { Flow } from "lightning-flow-scanner-core/out/main/models/Flow";
import { ScanResult } from "lightning-flow-scanner-core/out/main/models/ScanResult";
import { FindFlows } from "../../libs/FindFlows";
import { ParseFlows } from "../../libs/ParseFlows";
import { Violation } from "../../models/Violation";
import { ScannerOptions } from "lightning-flow-scanner-core/out/main/models/ScannerOptions";
import { Override } from "lightning-flow-scanner-core/out/main/models/Override";
import { FlowScanOverrides } from "lightning-flow-scanner-core/out/main/models/FlowScanOverrides";
import * as chalk from "chalk";
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
  protected scannerOptions: ScannerOptions;

  protected static flagsConfig = {
    throwerrors: flags.boolean({
      char: "e",
      description: messages.getMessage("throwErrors"),
    }),
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
    summary: {
      flows: number;
      errors: number;
      message: string;
    };
    results: Violation[];
  }> {
    // Load user options
    await this.loadScannerOptions(this.flags.config);

    // Retrieve flows from org if target has been provided
    if (this.flags.targetusername) {
      await this.retrieveFlowsFromOrg();
    }

    // List flows that will be scanned
    let flowFiles;
    if (this.flags.directory && this.flags.sourcepath) {
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

    // Perform scan
    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    let scanResults: ScanResult[];
    if (this.scannerOptions && Object.keys(this.scannerOptions).length > 0) {
      scanResults = core.scan(parsedFlows, this.scannerOptions);
    } else {
      scanResults = core.scan(parsedFlows);
    }

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
                ruleResult.ruleDescription
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
    if (errors.length > 0) {
      for (const lintResult of errors) {
        if (!this.flags.throwerrors) {
          // this.ux.warn(
          //   'The rule "' + lintResult.ruleName + '" has been violated in flow "' + lintResult.flowName + '" at node "' + lintResult.details.name + '" of type "' + lintResult.details.type +'". ' + lintResult.description
          //   );
        } else {
          throw new SfdxError(
            'The rule "' +
              lintResult.ruleName +
              '" has been violated in flow "' +
              lintResult.flowName +
              '" at node "' +
              lintResult.details.name +
              '" of type "' +
              lintResult.details.type +
              '". ' +
              lintResult.description
          );
        }
      }
    }
    return { summary, results: errors };
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

    // Build ScannerOptions from config file values
    const rules = this.userConfig["rules"];
    const flowScanOverrides = [];
    if (this.userConfig["exceptions"]) {
      const exceptions = this.userConfig["exceptions"];
      exceptions.forEach((exception) => {
        const exceptionKeys = Object.keys(exception);
        if (exceptionKeys.length > 0) {
          const innerObject = exception[exceptionKeys[0]][0];
          const propertyKeys = Object.keys(innerObject);
          const overrides = [];
          if (propertyKeys.length > 0) {
            const issues = innerObject[propertyKeys[0]];
            for (const issue of issues) {
              overrides.push(new Override(propertyKeys[0], issue));
            }
          }
        flowScanOverrides.push(new FlowScanOverrides(exceptionKeys[0], overrides));
        }
      });
    }
    // todo replace rulenames with new core rule severity property
    const rulenames = [];
    for (const r in rules) {
      const rulename = Object.keys(rules[r]);
      rulenames.push(rulename);
    }
    this.scannerOptions = new ScannerOptions(
      rulenames.length === 0 ? null : rulenames,
      flowScanOverrides
    );
  }

  // Use sfdx to retrieve flows from remote org
  private async retrieveFlowsFromOrg() {
    let errored = false;
    this.ux.startSpinner(chalk.yellowBright("Retrieving Metadata..."));
    const retrieveCommand = `sfdx force:source:retrieve -m Flow -u "${this.flags.targetusername}"`;
    try {
      await exec(retrieveCommand, {
        maxBuffer: 1000000 * 1024,
      });
    } catch (exception) {
      errored = true;
      this.ux.errorJson(exception);
      this.ux.stopSpinner(chalk.redBright("Retrieve Operation Failed."));
    }
    if (errored) {
      throw new SfdxError(
        messages.getMessage("errorRetrievingMetadata"),
        "",
        [],
        1
      );
    } else {
      this.ux.stopSpinner(chalk.greenBright("Retrieve Completed ✔."));
    }
  }
}
