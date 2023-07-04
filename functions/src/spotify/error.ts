import type { Response } from 'node-fetch'

export const handleRepsonse = async <T>(method: () => Promise<Response>): Promise<T> => {
    try {
        const res = await method()
        if (res.status < 300) {
            if (res.headers.get('content-type')?.startsWith('application/json'))
                return await res.json()
            else return true as T
        } else {
            let error: any
            try {
                error = (await res.json()).error
            } catch {
                error = { status: res.status, statusText: res.statusText }
            }
            throw error;
        }
    } catch (error) {
        throw error
    }
}

export class PlaylistDeletedError extends Error {}