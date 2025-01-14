import { cosmiconfig } from "cosmiconfig";
export async function loadScannerOptions(
  forcedConfigFile: string,
): Promise<any> {
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
  let explorerResults;
  if (forcedConfigFile) {
    // Forced config file name
    explorerResults = await explorer.load(forcedConfigFile);
  }
  // Let cosmiconfig look for a config file
  explorerResults = explorerResults ?? (await explorer.search());
  return explorerResults?.config ?? undefined;
}
