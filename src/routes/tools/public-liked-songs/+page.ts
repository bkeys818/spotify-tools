import { sessionIsAuthorized } from '$lib/spotify';
import type { PageLoad } from './$types';
const requredScopes = ['user-library-read', 'playlist-modify-public'];
export const load: PageLoad = ({  }) => ({
    props: {
        // FIXME
        // isAuthenticated: sessionIsAuthorized(session, ['user-library-read', 'playlist-modify-public'])
    },
    isAuthenticated: true
});