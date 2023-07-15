/** @type {import('jest').Config} */
const config = {
	preset: 'ts-jest',
	testEnvironment: './tests/firebase-env.ts',
	// testMatch: ['"**/?(*.)+test.[jt]s?(x)'],
	setupFilesAfterEnv: ['./tests/setup.ts'],
	verbose: true,
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
		'^src$': '<rootDir>/src'
	},
	transform: {
		'^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tests/tsconfig.json' }]
	}
}

module.exports = config
