export class Violation {
  public flowName: string;
  public ruleName: string;
  public description: string;
  public details;
  public type: string;
  public severity: string;

  constructor(flowName: string, ruleName: string, description: string, severity: string, type: string, details?) {
    this.flowName = flowName;
    this.ruleName = ruleName;
    this.description = description;
    this.severity = severity;
    this.type = type;
    this.details = details;
  }
}
