import { describe, it, expect } from 'vitest';
import { AUDIT_RULES, CORE_VIEW_TYPES } from '../rules';

describe('AUDIT_RULES', () => {
	it('contains the expected curated rules', () => {
		expect(AUDIT_RULES).toContain('button-name');
		expect(AUDIT_RULES).toContain('label');
		expect(AUDIT_RULES).toContain('aria-input-field-name');
	});

	it('does not include color-contrast', () => {
		expect(AUDIT_RULES).not.toContain('color-contrast');
	});

	it('has no duplicate entries', () => {
		expect(new Set(AUDIT_RULES).size).toBe(AUDIT_RULES.length);
	});
});

describe('CORE_VIEW_TYPES', () => {
	it('includes standard Obsidian built-in views', () => {
		expect(CORE_VIEW_TYPES.has('markdown')).toBe(true);
		expect(CORE_VIEW_TYPES.has('file-explorer')).toBe(true);
		expect(CORE_VIEW_TYPES.has('empty')).toBe(true);
	});

	it('does not include custom plugin view types', () => {
		expect(CORE_VIEW_TYPES.has('kanban')).toBe(false);
		expect(CORE_VIEW_TYPES.has('dataview')).toBe(false);
	});
});
