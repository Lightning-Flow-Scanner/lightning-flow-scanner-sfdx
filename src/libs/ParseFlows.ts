import * as path from 'path';
import {Flow} from 'lightningflowscan-core/out/main/models/Flow';
import {XMLParser} from './XMLParser';
import { fs } from '@salesforce/core/lib/util/fs';

export async function ParseFlows(selectedUris: any) {

  let parsedFlows = [];
  for (let uri of selectedUris) {
    try {
      const parsedContent: { Flow: Flow } = await new XMLParser().execute(await fs.readFile(path.normalize(uri)));
      parsedFlows.push(new Flow(
        {
          interviewLabel: parsedContent.Flow.interviewLabel,
          label: parsedContent.Flow.label,
          processMetadataValues: parsedContent.Flow.processMetadataValues,
          processType: parsedContent.Flow.processType,
          start: parsedContent.Flow.start,
          status: parsedContent.Flow.status,
          uri: uri,
          xmldata: parsedContent
        }));
    } catch (e) {
      // todo catch error
    }
  }
  return parsedFlows;
}
