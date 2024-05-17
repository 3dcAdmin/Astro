// NOTE: Sometimes, tests fail with `TypeError: process.stdout.clearLine is not a function`
// for some reason. This comes from Vite, and is conditionally called based on `isTTY`.
// We set it to false here to skip this odd behavior.
process.stdout.isTTY = false;

const config = {
	// TODO: add more tests like view transitions and audits, and fix them. Some of them are failing.
	testMatch: ['e2e/css.test.js', 'e2e/prefetch.test.js'],
	/* Maximum time one test can run for. */
	timeout: 40 * 1000,
	expect: {
		/**
		 * Maximum time expect() should wait for the condition to be met.
		 * For example in `await expect(locator).toHaveText();`
		 */
		timeout: 4 * 1000,
	},
	/* Fail the build on CI if you accidentally left test in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 3 : 0,
	/* Opt out of parallel tests on CI. */
	workers: 1,
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
		actionTimeout: 0,
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'Firefox Stable',
			use: {
				browserName: 'firefox',
				channel: 'firefox',
				args: ['--use-gl=egl'],
			},
		},
	],
};

export default config;
