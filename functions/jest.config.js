/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jest-environment-firebase-functions',
	/** @type {import('jest-environment-firebase-functions').Options} */
	testEnvironmentOptions: {
		projectId: 'ben-keys-spotify-tools-dev',
		storageBucket: 'ben-keys-spotify-tools-dev.appspot.com',
		keyPath: './serviceAccountKey.json'
	},
	setupFilesAfterEnv: ['./tests/setup.ts'],
	verbose: true,
	coverageReporters: ['html', 'json-summary'],
	coverageDirectory: './coverage',
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
		'^src$': '<rootDir>/src'
	},
	transform: {
		'^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tests/tsconfig.json' }]
	}
}
