export class Violation {
  public flowlabel: string;
  public ruleLabel: string;
  public ruleDescription: string;
  public numberOfViolations: number;

  constructor(flowlabel: string, ruleLabel: string, ruleDescription: string, numberOfViolatinos: number){
    this.flowlabel = flowlabel;
    this.ruleLabel = ruleLabel;
    this.ruleDescription = ruleDescription;
    this.numberOfViolations = numberOfViolatinos;
  }
}
