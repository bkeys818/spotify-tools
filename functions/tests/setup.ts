afterAll(() => {
	if (process.env.JEST_ENV == 'FirebaseEnvironment') testEnv.cleanup()
})
