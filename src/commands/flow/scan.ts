import { SfdxCommand, flags } from "@salesforce/command";
import { Messages, SfdxError } from "@salesforce/core";
import * as core from "lightning-flow-scanner-core/out";
import * as fs from "fs-extra";
import * as path from "path";
import { Flow } from "lightning-flow-scanner-core/out/main/models/Flow";
import { ScanResult } from "lightning-flow-scanner-core/out/main/models/ScanResult";
import { FindFlows } from "../../libs/FindFlows";
import { ParseFlows } from "../../libs/ParseFlows";
import { Violation } from "../../models/Violation";
import * as c from "chalk";
import { exec } from "child_process";
import * as Papa from "papaparse";
import { cosmiconfig } from "cosmiconfig";
import { ResultDetails } from "lightning-flow-scanner-core/out/main/models/ResultDetails";
import { RuleResult } from "lightning-flow-scanner-core/out/main/models/RuleResult";

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages("lightning-flow-scanner", "command");

export default class scan extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");
  public static examples: string[] = [
    "sfdx flow:scan",
    "sfdx flow:scan --failon warning",
    "sfdx flow:scan -c path/to/config.json",
    "sfdx flow:scan -c path/to/config.json --failon warning",
    "sfdx flow:scan -d path/to/flows/directory",
    "sfdx flow:scan --failon warning --output csv",
    "sfdx flow:scan --failon warning --output csv --outputfile /tmp/scan-results.csv",
  ]

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;
  protected static supportsUsername = true;

  protected userConfig;
  protected failOn = "error";
  protected output = "console"
  protected outputFile = path.join(process.cwd(), "report", "flow-scanner-results.csv");
  protected errorCounters: Map<string, number> = new Map<string, number>();

  protected static flagsConfig = {
    directory: flags.filepath({
      char: "d",
      description: messages.getMessage("directoryToScan"),
      required: false,
      name: "Scan Directory"
    }),
    config: flags.filepath({
      char: "c",
      description: "Path to configuration file",
      required: false,
      name: "Config file"
    }),
    failon: flags.enum({
      char: "f",
      description: "Thresold failure level (error, warning, note, or never) defining when the command return code will be 1",
      options: ["error", "warning", "note", "never"],
      default: "error",
      name: "Fail on level"
    }),
    output: flags.enum({
      char: "o",
      description: "Output file",
      options: ["console", "csv"],
      default: "console",
      name: "Output format"
    }),
    outputfile: flags.filepath({
      char: "o",
      description: "Output file",
      default: path.join(process.cwd(), "report", "flow-scanner-results.csv"),
      name: "Output format"
    }),
    retrieve: flags.boolean({
      char: "r",
      description: "Force retrieve Flows from org at the start of the command",
      default: false,
      name: "retrieve"
    }),
    sourcepath: flags.filepath({
      char: "p",
      description: "comma-separated list of source flow paths to scan",
      required: false,
    })
  };

  public async run(): Promise<{
    status: number,
    summary: {
      flowsNumber: number;
      results: number;
      message: string;
    };
    results: Violation[];
  }> {
    this.failOn = this.flags.failon || "error";
    this.output = this.flags.output || "console";
    this.outputFile = this.flags.outputfile || path.join(process.cwd(), "report", "flow-scanner-results.csv");
    this.ux.startSpinner('Loading Lightning Flow Scanner');
    await this.loadScannerOptions(this.flags.config);
    if (this.flags.targetusername) {
      await this.retrieveFlowsFromOrg();
    }
    const flowFiles = this.findFlows();
    this.ux.startSpinner(`Identified ${flowFiles.length} flows to scan`);
    const parsedFlows: Flow[] = await ParseFlows(flowFiles);
    const scanResults: ScanResult[] = (this.userConfig && Object.keys(this.userConfig).length > 0) ? core.scan(parsedFlows, this.userConfig) : core.scan(parsedFlows);
    this.ux.stopSpinner(`Scan complete`);
    this.ux.log('');

    // Build results
    const results = this.buildResults(scanResults);

    const resultsByFlow = {};
    if (results.length > 0) {
      for (const result of results) {
        resultsByFlow[result.flowName] = resultsByFlow[result.flowName] || [];
        resultsByFlow[result.flowName].push(result);
      }
    }

    await this.outputResults(resultsByFlow, scanResults);

    this.ux.styledHeader("Total: " +
      c.red(results.length +
        " Results") + " in " +
      c.yellow(scanResults.length +
        " Flows") + ".");

    // TODO CALL TO ACTION
    this.ux.log('');
    this.ux.log(c.bold(c.italic(c.yellowBright('Be a part of our mission to champion Best Practices and empower Flow Builders by starring us on GitHub:'))));
    this.ux.log(c.italic(c.blueBright(c.underline("https://github.com/Force-Config-Control/lightning-flow-scanner-sfdx"))));

    const status = this.getStatus();
    // Set status code = 1 if there are errors, that will make cli exit with code 1 when not in --json mode
    if (status > 0) {
      process.exitCode = status;
    }
    const summary = {
      flowsNumber: scanResults.length, 'results': results.length, 'message': "A total of " +
        results.length +
        " results have been found in " +
        scanResults.length +
        " flows.", errorLevelsDetails: {}
    };
    return { summary, status: status, results };
  }

  private findFlows() {
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
    return flowFiles;
  }

  private getStatus() {
    let status = 0;
    if (this.failOn === 'never') {
      status = 0;
    }
    else {
      if (this.failOn === "error" && (this.errorCounters["error"] || 0) > 0) {
        status = 1;
      }
      else if (this.failOn === 'warning' &&
        ((this.errorCounters["error"] || 0) > 0)
        || ((this.errorCounters["warning"] || 0) > 0)) {
        status = 1;
      }
      else if (this.failOn === 'note' &&
        ((this.errorCounters["error"] || 0) > 0)
        || ((this.errorCounters["warning"] || 0) > 0)
        || ((this.errorCounters["note"] || 0) > 0)) {
        status = 1;
      }
    }
    return status;
  }

  private buildResults(scanResults) {
    const errors = [];
    for (const scanResult of scanResults) {
      const flowName = scanResult.flow.label[0];
      const flowType = scanResult.flow.type[0];
      for (const ruleResult of scanResult.ruleResults as RuleResult[]) {
        const ruleDescription = ruleResult.ruleDefinition.description;
        const rule = ruleResult.ruleDefinition.label;
        if (ruleResult.occurs && ruleResult.details && ruleResult.details.length > 0) {
          const severity = ruleResult.severity || "error"
          for (const result of (ruleResult.details as ResultDetails[])) {
            const detailObj = Object.assign(
              result,
              {
                ruleDescription,
                rule,
                flowName,
                flowType,
                severity
              }
            );
            errors.push(detailObj);
            this.errorCounters[severity] = (this.errorCounters[severity] || 0) + 1;
          }
        }
      }
    }
    return errors;
  }

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

  private async outputResults(resultsByFlow, scanResults) {
    // CSV
    if (this.output === 'csv') {
      const csvColumns = ["Flow API Name", "Rule Name", "Item", "Severity", "Rule description", "Rule Type", "Flow Type", "Flow Label"]
      // Build CSV Data
      const csvData = [];
      for (const flowApiName of Object.keys(resultsByFlow)) {
        const flowResults = resultsByFlow[flowApiName];
        for (const flowResult of flowResults) {
          const line = [flowApiName,
            flowResult.rule,
            flowResult.name,
            flowResult.severity,
            flowResult.ruleDescription,
            flowResult.type,
            flowResult.flowType,
            flowResult.flowName
          ];
          csvData.push(line);
        }
      }
      // Write CSV
      const csvText = Papa.unparse({
        "fields": csvColumns,
        "data": csvData
      });
      await fs.ensureDir(path.dirname(this.outputFile));
      await fs.writeFile(this.outputFile, csvText, "utf8");
      this.ux.log(`Generated CSV output in ${this.outputFile}`)
    }
    // Console
    else {
      for (const resultKey in resultsByFlow) {
        const matchingScanResult = scanResults.find((res) => {
          return res.flow.label[0] === resultKey
        });
        this.ux.styledHeader("Flow: " + c.yellow(resultKey) + " " + c.red("(" + resultsByFlow[resultKey].length + " results)"));
        this.ux.log(c.italic('Type: ' + matchingScanResult.flow.type));
        this.ux.log('');
        // todo flow uri
        this.ux.table(resultsByFlow[resultKey], ['rule', 'type', 'name']);
        this.ux.log('');
      }
    }
  }

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
