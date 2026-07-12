import axe from 'axe-core';
import type { AxeViolation } from './report';

export interface AuditResult {
	violations: AxeViolation[];
}

// Typed wrapper around axe.run — @types/axe-core predates the run() API.
export async function runAxe(el: HTMLElement, rules: readonly string[]): Promise<AuditResult> {
	const results = await (axe as unknown as {
		run(el: HTMLElement, opts: unknown): Promise<{ violations: AxeViolation[] }>;
	}).run(el, { runOnly: { type: 'rule', values: [...rules] } });
	return { violations: results.violations };
}

export const AUDIT_RULES = [
	'aria-input-field-name',
	'label',
	'scrollable-region-focusable',
	'aria-prohibited-attr',
	'button-name',
	'link-name',
	'image-alt',
	'aria-valid-attr-value',
	'aria-required-attr',
] as const;

export type AuditRule = (typeof AUDIT_RULES)[number];

export const CORE_VIEW_TYPES = new Set([
	'empty',
	'markdown',
	'file-explorer',
	'search',
	'outline',
	'backlink',
	'tag',
]);
