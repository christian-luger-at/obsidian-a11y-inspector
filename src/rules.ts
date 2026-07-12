import axe from 'axe-core';
import type { AxeViolation } from './report';

export interface AuditResult {
	violations: AxeViolation[];
}

// color-contrast is excluded unconditionally — it is theme-dependent and
// cannot be attributed to a specific plugin.
const ALWAYS_EXCLUDED_RULES = ['color-contrast'];

export async function runAxe(
	el: HTMLElement,
	tags: readonly string[],
): Promise<AuditResult> {
	const results = await (axe as unknown as {
		run(el: HTMLElement, opts: unknown): Promise<{ violations: AxeViolation[] }>;
	}).run(el, {
		runOnly: { type: 'tag', values: [...tags] },
		rules: Object.fromEntries(ALWAYS_EXCLUDED_RULES.map(r => [r, { enabled: false }])),
	});
	return { violations: results.violations };
}

export const CORE_VIEW_TYPES = new Set([
	'empty',
	'markdown',
	'file-explorer',
	'search',
	'outline',
	'backlink',
	'tag',
]);
