import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
    const scopes = url.searchParams.get('scopes')?.split(' ') ?? [];
    return { scopes };
};