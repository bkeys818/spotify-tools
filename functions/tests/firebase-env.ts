import NodeEnvironment from 'jest-environment-node'
import configTest from 'firebase-functions-test'
import type { AppOptions } from 'firebase-admin'
import { existsSync } from 'fs'

const config: AppOptions = {
	projectId: 'ben-keys-spotify-tools-dev',
	storageBucket: 'ben-keys-spotify-tools-dev.appspot.com'
}
const keyPath = './serviceAccountKey.json'

type FirebaseGlobal = {
	testEnv: ReturnType<typeof configTest>
}

declare global {
	const testEnv: FirebaseGlobal['testEnv']
}

export default class FirebaseEnvironment extends NodeEnvironment {
	declare global: FirebaseGlobal & NodeEnvironment['global']

	async setup() {
		await super.setup()
		if (!existsSync(keyPath))
			throw new Error('Missing path to admin credentials.\nSee https://firebase.google.com/docs/functions/local-shell#set_up_admin_credentials_optional.')
		this.global.testEnv = configTest(config, keyPath)
		this.syncEnv('FIREBASE_CONFIG')
		this.syncEnv('GCLOUD_PROJECT')
		this.syncEnv('GOOGLE_APPLICATION_CREDENTIALS')
		this.global.process.env.JEST_ENV = FirebaseEnvironment.name
	}

	private syncEnv(key: string) {
		this.global.process.env[key] = process.env[key]
	}
}
