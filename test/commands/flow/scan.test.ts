import { expect, test } from '@salesforce/command/lib/test';

describe('flow:scan', () => {
  test
    .stdout()
    .command(['flow:scan','--json'])
    .it('runs flow:orscang', ctx => {
      expect(ctx.stdout).to.contain('0');
    });
});
