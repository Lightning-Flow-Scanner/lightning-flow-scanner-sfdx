import Scan from "../../../src/commands/flow/scan.js";
import { ScanResult } from "../../../src/models/ScanResult.js";
import { expect } from "chai";
import { Config } from "@oclif/core";

describe("flow:scan", () => {
  let config: Config;

  beforeEach(async () => {
    config = await Config.load(import.meta.url);
  });

  it("scan no flows", async () => {
    const output = await new Scan([], config).run();
    expect(output.summary.flowsNumber).to.equal(0);
  });
  it("throw error if --directory and --sourcepath are given", async () => {
    let output: ScanResult;
    try {
      const output = await new Scan(
        ["--directory", "test/", "--files", "test/commands/flow/scan.test.ts"],
        config,
      ).run();
      console.log(output);
    } catch (e) {
      expect((e as Error).message).to.contains(
        "cannot also be provided when using --directory",
      );
    }
    expect(output).to.be.equal(undefined);
  });
});
