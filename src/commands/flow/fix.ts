import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages, SfError } from "@salesforce/core";

import { ScanResult } from "../../models/ScanResult.js";
import CoreFixService from "../../libs/CoreFixService.js";

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url, true);

const commandMessages = Messages.loadMessages(
  "lightning-flow-scanner",
  "fix-command",
);

export default class FlowFix extends SfCommand<ScanResult> {
  static override description =
    commandMessages.getMessage("commandDescription");

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public static override flags = {
    rules: Flags.string({
      multiple: true,
      char: "r",
      description: commandMessages.getMessage("flagsRulesDescription"),
      required: true,
    }),
    dir: Flags.string({
      char: "d",
      multiple: true,
      description: commandMessages.getMessage("flagsDirsDescription"),
      exclusive: ["files"],
    }),
    files: Flags.file({
      exists: true,
      multiple: true,
      description: commandMessages.getMessage("flagsFilesDescription"),
      char: "f",
      charAliases: ["p"],
    }),
  };

  public async run(): Promise<ScanResult> {
    const { flags } = await this.parse(FlowFix);
    const { dir, files, rules } = flags;
    if (!dir && !files) {
      throw new SfError(
        commandMessages.getMessage("errorMutuallyExclusiveRequired"),
      );
    }

    this.spinner.start("Loading Lightning Flow Scanner", null, {
      stdout: true,
    });

    const fixService = new CoreFixService(dir, files, rules);

    const outMessage = (await fixService.fix()).join(", ");

    this.debug(`test`, outMessage);

    this.spinner.stop(`Fix Complete.. Fixed ${outMessage}`);

    return {
      summary: {
        message: `Fixed ${outMessage}`,
      },
    } as ScanResult;
  }
}
