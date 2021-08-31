export class Violation {
  public flowlabel: string;
  public ruleLabel: string;
  public ruleDescription: string;
  public violation;

  constructor(flowlabel: string, ruleLabel: string, ruleDescription: string, violation){
    this.flowlabel = flowlabel;
    this.ruleLabel = ruleLabel;
    this.ruleDescription = ruleDescription;
    this.violation = violation;
  }
}
