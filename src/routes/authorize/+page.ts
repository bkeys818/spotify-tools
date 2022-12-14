import type { PageLoad } from './$types';
import { authorizeTool } from '$lib/firebase/functions'

export const load: PageLoad = async ({ url }) => {
    const code = url.searchParams.get('code')
    // check scope
    if (code) {
        return { code: code }
    } else {
        const scopes = url.searchParams.get('scopes')?.split(' ') ?? [];
        return { scopes };
    }
};