import { app } from '.'
import { getAuth } from 'firebase/auth'

export const auth = getAuth(app)
