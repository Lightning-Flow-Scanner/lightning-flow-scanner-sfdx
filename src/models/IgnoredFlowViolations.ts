export class IgnoredFlowViolations {

  public flowlabels: string[];

  constructor(flowlabels: string[] | string) {
    if (Array.isArray(flowlabels)) {
      this.flowlabels = flowlabels;
    } else {
      this.flowlabels = [flowlabels];
    }
  }
}
