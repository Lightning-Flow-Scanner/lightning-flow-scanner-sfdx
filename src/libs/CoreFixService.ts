import { IRulesConfig } from "lightning-flow-scanner-core/main/internals/internals.js";
import { writeFileSync } from "node:fs";

import { FindFlows } from "./FindFlows.js";

import * as core from "lightning-flow-scanner-core";

import type { ScanResult as FlowScanResults } from "lightning-flow-scanner-core";

export default class CoreFixService {
  public constructor(
    private readonly dir,
    private readonly file,
    private readonly rules,
  ) {}

  public async fix(): Promise<string[]> {
    //find flow file(s)
    const flowFiles = this.findFlows();
    const parsedFlows = await core.parse(flowFiles);

    // make on the fly rule
    const flatRules = this.rules
      .map((content) => {
        return { rules: { [content]: { severity: "error" } } };
      })
      .reduce(
        (prev, current) => {
          prev.rules = { ...prev.rules, ...current.rules };
          return prev;
        },
        { rules: {} },
      ) as IRulesConfig;

    // scan
    const scanResults: FlowScanResults[] = core.scan(parsedFlows, flatRules);

    // fix
    const fixFlow: FlowScanResults[] = core.fix(scanResults);
    fixFlow.forEach((fixedObject) => {
      writeFileSync(fixedObject.flow.fsPath, fixedObject.flow.toXMLString());
    });

    return fixFlow.map((fixedOut) => fixedOut.flow.fsPath);
  }

  private findFlows(): string[] {
    if (this.dir) {
      return this.findFlowsByDir(this.dir);
    }
    return this.findFlowsByPath(this.file);
  }

  private findFlowsByDir(dir: string[]): string[] {
    return dir
      .map((dirName) => {
        return FindFlows(dirName);
      })
      .flat(1);
  }

  private findFlowsByPath(path: string[]): string[] {
    return [...path];
  }
}
