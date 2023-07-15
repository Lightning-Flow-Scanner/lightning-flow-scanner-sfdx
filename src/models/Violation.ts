export class Violation {
  public flowName: string;
  public ruleName: string;
  public description: string;
  public details;
  public severity: string;

  constructor(flowName: string, ruleName: string, description: string, severity: string, details?) {
    this.flowName = flowName;
    this.ruleName = ruleName;
    this.description = description;
    this.severity = severity;
    this.details = details;
  }
}
