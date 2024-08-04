import { Parser } from "xml2js";
import * as core from "lightning-flow-scanner-core";

export class XMLParser {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  public execute(xml): Promise<{ Flow: core.Flow }> {
    return new Promise<{ Flow: core.Flow }>((resolve, reject) => {
      this.parser.parseString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}
