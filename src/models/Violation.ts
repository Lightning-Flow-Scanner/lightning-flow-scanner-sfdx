export class Violation {
  public flowName: string;
  public ruleName: string;
  public description: string;
  public details;

  constructor(flowName: string, ruleName: string, description: string, details?) {
    this.flowName = flowName;
    this.ruleName = ruleName;
    this.description = description;
    this.details = details;
  }
}
