import {Parser} from 'xml2js';
import Flow from 'lightning-flow-scanner-core/out/main/models/Flow';

export class XMLParser{

  private parser : Parser;

  constructor(){
    this.parser = new Parser();
  }

  public execute(xml): Promise<{ Flow : Flow }>{
    return new Promise<{ Flow : Flow }>((resolve, reject) => {
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
