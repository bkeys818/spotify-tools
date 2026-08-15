/**
 * Was a `<script context="module">` export that the playlist route imported
 * straight out of the sibling `.svelte` file.
 *
 * Note this is a relative value and is used verbatim as a cookie `path`
 * attribute. Kept as-is so the auth cookie scoping behaves exactly as before.
 */
export const id = 'duplicate-remover'
export const path = './' + id
