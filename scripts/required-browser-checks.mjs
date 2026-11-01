// A skipped/fixme/expected-failure check is missing evidence, not a passing gate.
export default class RequiredBrowserChecks {
  onBegin(_config, suite) {
    this.tests = suite.allTests();
  }

  onEnd() {
    const unverified = this.tests?.filter(
      (test) =>
        test.expectedStatus !== 'passed' ||
        test.results.length === 0 ||
        test.results.some((result) => result.status !== 'passed'),
    );
    if (!this.tests?.length || unverified?.length) {
      console.error(
        'Required browser checks have failed or unverified results.',
      );
      return { status: 'failed' };
    }
  }
}
