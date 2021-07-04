export class IgnoredRuleViolationsInFlows {

  public ignoredRuleViolationsInFlows;

  constructor(ignoredRuleViolationsInFlows: any) {
    if (Array.isArray(ignoredRuleViolationsInFlows)) {
      this.ignoredRuleViolationsInFlows = ignoredRuleViolationsInFlows;
    } else {
      this.ignoredRuleViolationsInFlows = [ignoredRuleViolationsInFlows];
    }
  }
}
