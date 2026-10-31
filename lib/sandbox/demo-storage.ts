/**
 * File uploads in the tutorial never leave the browser: the file is read for
 * its name only and "stored" under a made-up key, so the flow carries on to
 * its API step, which mockFetch answers.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function demoUpload(key: string, file: File): Promise<{ error: { message: string } | null }> {
	await new Promise((r) => setTimeout(r, 400));
	return { error: null };
}

/** The tutorial's one, fictional user. */
export const DEMO_USER_ID = 'demo-user';
