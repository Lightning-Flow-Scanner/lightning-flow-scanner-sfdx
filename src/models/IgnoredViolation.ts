export class IgnoredViolation {

  public flowlabel: string;
  public ruleLabel?: string;

  constructor(label: string, ruleLabel?: string) {
    this.flowlabel = label;
    if(ruleLabel){
      this.ruleLabel = ruleLabel;
    }
  }
}
