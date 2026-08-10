/**
 * Site-wide constants.
 *
 * These deliberately live OUTSIDE app/layout.tsx: the header and footer need them, and layout.tsx
 * imports the header and footer, so exporting them from there creates an import cycle that
 * Turbopack surfaces as a bewildering "Cannot access 'l' before initialization" at build time.
 *
 * Swap SITE_URL/DEMO_URL here if the domains ever change — nothing else hardcodes them.
 */
export const SITE_URL = 'https://opentask.pranavkarra.me'
export const DEMO_URL = 'https://tryopentask.pranavkarra.me'
export const REPO_URL = 'https://github.com/junkdrawerlab/opentask'
/** `blob/main` base for repo files that have no site page (see lib/markdown.ts). */
export const REPO_BLOB = `${REPO_URL}/blob/main`
/** NB: the container package still lives under the personal account, not the org. */
export const IMAGE_URL = 'ghcr.io/pranav-karra-3301/opentask'

/** The install one-liner, shown (and copyable) in several places. */
export const DOCKER_RUN = `docker run -d --name opentask -p 7968:7968 -v ./data:/data ${IMAGE_URL}`
