/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Locals {
		spotify?: SpotifyAuth
	}
	// interface Platform {}
	interface Session {
		readonly spotify?: SpotifyAuth
	}
	// interface Stuff {}
}

interface SpotifyAuth {
	isAuthorized: boolean
	scopes: string[] 
}