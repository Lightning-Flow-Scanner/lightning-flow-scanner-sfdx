export class Violation {
  constructor(
    public flowName: string,
    public ruleName: string,
    public description: string,
    public severity: string,
    public type: string,
    public details?,
  ) {}
}
