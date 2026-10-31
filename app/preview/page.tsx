import { redirect } from 'next/navigation';

/** Old tutorial address: the chooser now lives at `/`. */
export default function Page() {
	redirect('/');
}
