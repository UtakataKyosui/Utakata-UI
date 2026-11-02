// A skipped/fixme/expected-failure check is missing evidence, not a passing gate.
export default class RequiredBrowserChecks {
  constructor(options = {}) {
    this.requiredIds = options.requiredIds ?? [];
  }

  onBegin(_config, suite) {
    this.tests = suite.allTests();
    this.missing = ['chromium-light', 'chromium-dark'].flatMap((project) =>
      this.requiredIds
        .filter(
          (id) =>
            !this.tests.some(
              (test) =>
                test.title.includes(`[${id}]`) &&
                test.titlePath().includes(project),
            ),
        )
        .map((id) => `${project}: ${id}`),
    );
  }

  onEnd() {
    const unverified = this.tests?.filter(
      (test) =>
        test.expectedStatus !== 'passed' ||
        test.results.length === 0 ||
        test.results.some((result) => result.status !== 'passed'),
    );
    if (!this.tests?.length || unverified?.length || this.missing?.length) {
      console.error(
        'Required browser checks have failed or unverified results.',
      );
      if (this.missing?.length)
        console.error('Missing coverage:', this.missing);
      return { status: 'failed' };
    }
  }
}
