import {
  fix,
  parse,
  scan,
  ScanResult as ScanResults,
} from "lightning-flow-scanner-core";
import { IRulesConfig } from "lightning-flow-scanner-core/main/interfaces/IRulesConfig.js";
import { writeFileSync } from "node:fs";

import { FindFlows } from "./FindFlows.js";

export default class CoreFixService {
  public constructor(
    private readonly dir,
    private readonly file,
    private readonly rules,
  ) {}

  public async fix(): Promise<string[]> {
    //find flow file(s)
    let flowFiles;
    if (this.dir) {
      flowFiles = this.findFlowsByDir(this.dir);
    } else {
      flowFiles = this.findFlowsByPath(this.file);
    }
    const parsedFlows = await parse(flowFiles);

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
    const scanResults: ScanResults[] = scan(parsedFlows, flatRules);

    // fix
    const fixFlow: ScanResults[] = fix(scanResults);
    fixFlow.forEach((fixedObject) => {
      writeFileSync(fixedObject.flow.fsPath, fixedObject.flow.toXMLString());
    });

    return fixFlow.map((fixedOut) => fixedOut.flow.fsPath);
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
