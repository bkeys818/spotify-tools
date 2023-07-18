import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export const app = initializeApp()
export const db = getFirestore()
