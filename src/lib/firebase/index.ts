import { initializeApp } from 'firebase/app'
import { dev } from '$app/environment'

// Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyAvylo56qzom4skSQubaPgVy6_UIiO_t-k',
	authDomain: 'ben-keys-spotify-tools.firebaseapp.com',
	projectId: 'ben-keys-spotify-tools',
	storageBucket: 'ben-keys-spotify-tools.appspot.com',
	messagingSenderId: '677422260099',
	appId: '1:677422260099:web:ff85f24c80cacc7360e0b6',
	measurementId: 'G-Y2P7NPJDBH'
}
// Development configuration
const devConfig = {
	apiKey: 'AIzaSyDoLDs22E8A3pUGnFrip7OBQjqqTJgEf6Q',
	authDomain: 'ben-keys-spotify-tools-dev.firebaseapp.com',
	projectId: 'ben-keys-spotify-tools-dev',
	storageBucket: 'ben-keys-spotify-tools-dev.appspot.com',
	messagingSenderId: '248200588433',
	appId: '1:248200588433:web:74c4fc3914d81e0e956330'
}

// Initialize Firebase
export const app = initializeApp(dev ? devConfig : firebaseConfig)
