import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages, SfError } from "@salesforce/core";
import * as core from "lightning-flow-scanner-core";
import * as fse from "fs-extra";
import chalk from "chalk";
import { exec } from "child_process";

import { loadScannerOptions } from "../../libs/ScannerConfig.js";
import { FindFlows } from "../../libs/FindFlows.js";
import { ScanResult } from "../../models/ScanResult.js";

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages("lightning-flow-scanner", "command");

export default class Scan extends SfCommand<ScanResult> {
  public static description = messages.getMessage("commandDescription");
  public static examples: string[] = [
    "sf flow scan",
    "sf flow scan --failon warning",
    "sf flow scan -c path/to/config.json",
    "sf flow scan -c path/to/config.json --failon warning",
    "sf flow scan -d path/to/flows/directory",
  ];

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  public static requiresProject = false;
  protected static supportsUsername = true;

  protected userConfig;
  protected failOn = "error";
  protected errorCounters: Map<string, number> = new Map<string, number>();

  public static readonly flags = {
    directory: Flags.directory({
      char: "d",
      description: messages.getMessage("directoryToScan"),
      required: false,
      exists: true,
    }),
    config: Flags.file({
      char: "c",
      description: "Path to configuration file",
      required: false,
    }),
    failon: Flags.option({
      char: "f",
      description:
        "Threshold failure level (error, warning, note, or never) defining when the command return code will be 1",
      options: ["error", "warning", "note", "never"] as const,
      default: "error",
    })(),
    retrieve: Flags.boolean({
      char: "r",
      description: "Force retrieve Flows from org at the start of the command",
      default: false,
    }),
    sourcepath: Flags.directory({
      char: "p",
      description: "Comma-separated list of source flow paths to scan",
      required: false,
    }),
    targetusername: Flags.string({
      char: "u",
      description:
        "Retrieve the latest metadata from the target before the scan.",
      required: false,
      charAliases: ["o"],
    }),
  };

  public async run(): Promise<ScanResult> {
    const { flags } = await this.parse(Scan);
    this.failOn = flags.failon || "error";
    this.spinner.start("Loading Lightning Flow Scanner");
    this.userConfig = await loadScannerOptions(flags.config);
    if (flags.targetusername) {
      await this.retrieveFlowsFromOrg(flags.targetusername);
    }
    const flowFiles = this.findFlows(flags.directory, flags.sourcepath);
    this.spinner.start(`Identified ${flowFiles.length} flows to scan`);
    // to
    // core.Flow
    const parsedFlows = await core.parse(flowFiles);

    const scanResults: core.ScanResult[] =
      this.userConfig && Object.keys(this.userConfig).length > 0
        ? core.scan(parsedFlows, this.userConfig)
        : core.scan(parsedFlows);

    this.debug("scan results", ...scanResults);
    this.spinner.stop(`Scan complete`);
    this.log("");

    // Build results
    const results = this.buildResults(scanResults);

    if (results.length > 0) {
      const resultsByFlow = {};
      for (const result of results) {
        resultsByFlow[result.flowName] = resultsByFlow[result.flowName] || [];
        resultsByFlow[result.flowName].push(result);
      }
      for (const resultKey in resultsByFlow) {
        const matchingScanResult = scanResults.find((res) => {
          return res.flow.label === resultKey;
        });
        this.styledHeader(
          "Flow: " +
            chalk.yellow(resultKey) +
            " " +
            chalk.red("(" + resultsByFlow[resultKey].length + " results)"),
        );
        this.log(chalk.italic("Type: " + matchingScanResult.flow.type));
        this.log("");
        // todo flow uri
        //this.table(resultsByFlow[resultKey], ['rule', 'type', 'name', 'severity']);
        this.table({
          data: resultsByFlow[resultKey],
          columns: ["rule", "type", "name", "severity"],
        });
        this.log("");
      }
    }
    this.styledHeader(
      "Total: " +
        chalk.red(results.length + " Results") +
        " in " +
        chalk.yellow(scanResults.length + " Flows") +
        ".",
    );

    // Display number of errors by severity
    for (const severity of ["error", "warning", "note"]) {
      const severityCounter = this.errorCounters[severity] || 0;
      this.log(`- ${severity}: ${severityCounter}`);
    }

    // TODO CALL TO ACTION
    this.log("");
    this.log(
      chalk.bold(
        chalk.italic(
          chalk.yellowBright(
            "Be a part of our mission to champion Flow Best Practices by starring us on GitHub:",
          ),
        ),
      ),
    );
    this.log(
      chalk.italic(
        chalk.blueBright(
          chalk.underline("https://github.com/Lightning-Flow-Scanner"),
        ),
      ),
    );

    const status = this.getStatus();
    // Set status code = 1 if there are errors, that will make cli exit with code 1 when not in --json mode
    if (status > 0) {
      process.exitCode = status;
    }
    const summary = {
      flowsNumber: scanResults.length,
      results: results.length,
      message:
        "A total of " +
        results.length +
        " results have been found in " +
        scanResults.length +
        " flows.",
      errorLevelsDetails: {},
    };
    return { summary, status: status, results };
  }

  private findFlows(directory: string, sourcepath: string) {
    // List flows that will be scanned
    let flowFiles;
    if (directory && sourcepath) {
      this.spinner.stop("Error");
      throw new SfError(
        "You can only specify one of either directory or sourcepath, not both.",
      );
    } else if (directory) {
      flowFiles = FindFlows(directory);
    } else if (sourcepath) {
      flowFiles = sourcepath.split(",").filter((f) => fse.exists(f));
    } else {
      flowFiles = FindFlows(".");
    }
    return flowFiles;
  }

  private getStatus() {
    let status = 0;
    if (this.failOn === "never") {
      status = 0;
    } else {
      if (this.failOn === "error" && this.errorCounters["error"] > 0) {
        status = 1;
      } else if (
        this.failOn === "warning" &&
        (this.errorCounters["error"] > 0 || this.errorCounters["warning"] > 0)
      ) {
        status = 1;
      } else if (
        this.failOn === "note" &&
        (this.errorCounters["error"] > 0 ||
          this.errorCounters["warning"] > 0 ||
          this.errorCounters["note"] > 0)
      ) {
        status = 1;
      }
    }
    return status;
  }

  private buildResults(scanResults) {
    const errors = [];
    for (const scanResult of scanResults) {
      const flowName = scanResult.flow.label;
      const flowType = scanResult.flow.type[0];
      for (const ruleResult of scanResult.ruleResults as core.RuleResult[]) {
        const ruleDescription = ruleResult.ruleDefinition.description;
        const rule = ruleResult.ruleDefinition.label;
        if (
          ruleResult.occurs &&
          ruleResult.details &&
          ruleResult.details.length > 0
        ) {
          const severity = ruleResult.severity || "error";
          for (const result of ruleResult.details as core.ResultDetails[]) {
            const detailObj = Object.assign(result, {
              ruleDescription,
              rule,
              flowName,
              flowType,
              severity,
            });
            errors.push(detailObj);
            this.errorCounters[severity] =
              (this.errorCounters[severity] || 0) + 1;
          }
        }
      }
    }
    return errors;
  }

  private async retrieveFlowsFromOrg(targetusername: string) {
    let errored = false;
    this.spinner.start(chalk.yellowBright("Retrieving Metadata..."));
    const retrieveCommand = `sf project retrieve start -m Flow -o "${targetusername}"`;
    try {
      await exec(retrieveCommand, {
        maxBuffer: 1000000 * 1024,
      });
    } catch (exception) {
      errored = true;
      this.toErrorJson(exception);
      this.spinner.stop(chalk.redBright("Retrieve Operation Failed."));
    }
    if (errored) {
      throw new SfError(
        messages.getMessage("errorRetrievingMetadata"),
        "",
        [],
        1,
      );
    } else {
      this.spinner.stop(chalk.greenBright("Retrieve Completed ✔."));
    }
  }
}
