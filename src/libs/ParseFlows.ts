import * as path from 'path';
import * as core from "lightning-flow-scanner-core/out";
import {XMLParser} from './XMLParser';
import { fs } from '@salesforce/core/lib/util/fs';

export async function ParseFlows(selectedUris: any) {

  let parsedFlows = [];
  for (let uri of selectedUris) {
    try {
      const parsedContent: { Flow: core.Flow } = await new XMLParser().execute(await fs.readFile(path.normalize(uri)));
      parsedFlows.push(new core.Flow(
        {
          'path': uri,
          interviewLabel: parsedContent.Flow.interviewLabel,
          label: parsedContent.Flow.label,
          processMetadataValues: parsedContent.Flow.processMetadataValues,
          processType: parsedContent.Flow.processType,
          start: parsedContent.Flow.start,
          status: parsedContent.Flow.status,
          xmldata: parsedContent
        }));
    } catch (e) {
      // todo catch error
    }
  }
  return parsedFlows;
}
