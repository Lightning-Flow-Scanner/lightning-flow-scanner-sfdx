import { runCommand } from "@oclif/test";
import { expect } from "chai";
import { Config } from "@oclif/core";
import sinon from "sinon";

import { ScanResult } from "../../../src/models/ScanResult.js";
import FlowFix from "../../../src/commands/flow/fix.js";
import CoreFixService from "../../../src/libs/CoreFixService.js";

describe("flow:fix", () => {
  it("runs flow:fix e2e", async () => {
    sinon
      .stub(CoreFixService.prototype, "fix")
      .resolves(["/path/to/resolved.flow-meta.xml"]);
    const config: Config = new Config({
      root: "/tmp",
      pjson: {
        name: "test-cli",
        version: "0.0.1",
        oclif: {
          bin: "test-cli",
        },
      },
    });
    await config.load();
    const scanResult: ScanResult = await new FlowFix(
      ["-r", "UnusedVariable", "-d", "."],
      config,
    ).run();
    expect(scanResult.summary.message).to.contain(
      "Fixed /path/to/resolved.flow-meta.xml",
    );
  });

  describe("runs flow:fix flags", () => {
    it("should throw an exception when rule is not specified", async () => {
      const { stderr } = await runCommand<ScanResult>("flow:fix -d a");
      expect(stderr).to.contain("Missing required flag rules");
    });
    it("should throw an exception when mutually exclusive flags specified", async () => {
      const { stderr } = await runCommand<ScanResult>(
        "flow:fix -r UnusedVariable -d a -f ./test/commands/flow/fix.test.ts",
      );
      expect(stderr).to.contain("cannot also be provided when using");
      expect(stderr).to.contain("--file");
      expect(stderr).to.contain("--dir");
    });
  });

  describe("runs flow:fix unit", () => {
    it("should throw an exception for mutually exclusive required", async () => {
      const config: Config = new Config({
        root: "/tmp",
        pjson: {
          name: "test-cli",
          version: "0.0.1",
          oclif: {
            bin: "test-cli",
          },
        },
      });
      await config.load();
      try {
        await new FlowFix(
          [
            "-r",
            "UnusedVariable",
            "-d",
            ".",
            "./src",
            "-f",
            "./test/commands/flow/fix.test.ts",
          ],
          config,
        ).run();
      } catch (error: any) {
        expect(error.message).to.contain("cannot also be provided when using");
        expect(error.message).to.contain("--file");
        expect(error.message).to.contain("--dir");
      }
    });
  });
});
