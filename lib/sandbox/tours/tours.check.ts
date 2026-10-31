/**
 * Static checks on the three tours — run with `node lib/sandbox/tours/tours.check.ts`
 * (part of `npm run check`). Catches what tsc can't:
 *   - a chapter whose first step has a `:param` path (Contents can't open it);
 *   - a `target` / `highlights` anchor that no component renders as `data-tour`;
 *   - duplicate step ids within a tour.
 * Reads the tour files as text (they import app modules plain node can't load),
 * so it only sees string-literal targets — template-built ones are skipped.
 * Anchors rendered from a template (`data-tour={`x-${id}`}`) match by their static prefix.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true })
	.flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []));
const source = ['components', 'app'].flatMap(walk).map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const literal = new Set([...source.matchAll(/data-tour=["']([^"']+)["']/g)].map((m) => m[1]));
const prefixes = [...source.matchAll(/data-tour=\{`([^`$]*)\$\{/g)].map((m) => m[1]).filter(Boolean);
// Anchors handed down as props: `data-tour="x"` on a component, `'data-tour': 'x'`, `tour="x"`, `dataTour="x"`.
for (const m of source.matchAll(/(?:\btour|'data-tour'|dataTour)\s*[=:]\s*\{?\s*["']([a-z0-9-]+)["']/g)) literal.add(m[1]);
const exists = (anchor: string) => literal.has(anchor) || prefixes.some((p) => anchor.startsWith(p));

let failures = 0;
const fail = (msg: string) => { console.error(`FAIL ${msg}`); failures++; };

for (const tier of ['explore', 'raise', 'scout']) {
	const text = fs.readFileSync(path.join('lib/sandbox/tours', `${tier}-tour.ts`), 'utf8');
	const body = text.slice(text.indexOf('chapters:'));
	// A chapter opens with `id: '…', title: '…', steps: [`; everything up to the next one is its steps.
	const heads = [...body.matchAll(/id:\s*'([^']+)',\s*title:\s*(?:'[^']*'|"[^"]*"|`[^`]*`),\s*steps:\s*\[/g)];
	assert.ok(heads.length > 0, `${tier}: no chapters found`);
	const ids = new Set<string>();
	let steps = 0;
	heads.forEach((h, i) => {
		const chunk = body.slice(h.index! + h[0].length, heads[i + 1]?.index ?? body.length);
		// A literal path, or a `const NAME = '…'` declared in the same file.
		const m = /path:\s*(?:['`]([^'`]+)['`]|([A-Z_]+)\b)/.exec(chunk);
		const first = m?.[1] ?? (m?.[2] ? new RegExp(`const ${m[2]} = ['\`]([^'\`]+)['\`]`).exec(text)?.[1] : undefined);
		if (!first) fail(`${tier}/${h[1]}: no step path`);
		else if (/\/:/.test(first)) fail(`${tier}/${h[1]}: first step path ${first} has a :param`);
		for (const s of chunk.matchAll(/\{\s*id:\s*'([^']+)',/g)) {
			if (ids.has(s[1])) fail(`${tier}: duplicate step id ${s[1]}`);
			ids.add(s[1]);
			steps++;
		}
		for (const t of chunk.matchAll(/\btarget:\s*'([^']+)'/g)) if (!exists(t[1])) fail(`${tier}/${h[1]}: no data-tour="${t[1]}" in components`);
		for (const hl of chunk.matchAll(/highlights:\s*\[([^\]]*)\]/g)) {
			for (const a of hl[1].matchAll(/'([^']+)'/g)) if (!exists(a[1])) fail(`${tier}/${h[1]}: no data-tour="${a[1]}" (highlight)`);
		}
	});
	console.log(`${tier}: ${heads.length} chapters, ${steps} steps`);
}
assert.equal(failures, 0, `${failures} tour check failure(s)`);
console.log('tours.check: ok');
