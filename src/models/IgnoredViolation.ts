export class IgnoredViolation {

  public ignoredRulesInFlows;

  constructor(ignoredRulesInFlows: any) {
    if (Array.isArray(ignoredRulesInFlows)) {
      this.ignoredRulesInFlows = ignoredRulesInFlows;
    } else {
      this.ignoredRulesInFlows = [ignoredRulesInFlows];
    }
  }
}
