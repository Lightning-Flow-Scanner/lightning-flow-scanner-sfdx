export class Violation {
  public label: string;
  public ruleLabel: string;
  public ruleDescription: string;
  public numberOfViolations: number;

  constructor(label: string, ruleLabel: string, ruleDescription: string, numberOfViolatinos: number){
    this.label = label;
    this.ruleLabel = ruleLabel;
    this.ruleDescription = ruleDescription;
    this.numberOfViolations = numberOfViolatinos;
  }
}
