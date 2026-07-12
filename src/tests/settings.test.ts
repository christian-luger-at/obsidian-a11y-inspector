import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, WCAG_TAGS } from '../settings';

describe('DEFAULT_SETTINGS', () => {
	it('has no target plugin selected by default', () => {
		expect(DEFAULT_SETTINGS.targetPluginId).toBe('');
	});

	it('defaults to AA conformance level', () => {
		expect(DEFAULT_SETTINGS.wcagLevel).toBe('AA');
	});

	it('has best practices disabled by default', () => {
		expect(DEFAULT_SETTINGS.bestPractices).toBe(false);
	});

	it('defaults to vault root for report folder', () => {
		expect(DEFAULT_SETTINGS.reportFolder).toBe('');
	});
});

describe('WCAG_TAGS', () => {
	it('level A contains wcag2a and wcag21a', () => {
		expect(WCAG_TAGS.A).toContain('wcag2a');
		expect(WCAG_TAGS.A).toContain('wcag21a');
	});

	it('level AA is a superset of level A', () => {
		for (const tag of WCAG_TAGS.A) {
			expect(WCAG_TAGS.AA).toContain(tag);
		}
	});

	it('level AA includes wcag22aa', () => {
		expect(WCAG_TAGS.AA).toContain('wcag22aa');
	});

	it('neither level includes color-contrast tags', () => {
		for (const tags of Object.values(WCAG_TAGS)) {
			expect(tags).not.toContain('color-contrast');
		}
	});

	it('has no duplicate tags per level', () => {
		for (const [level, tags] of Object.entries(WCAG_TAGS)) {
			expect(new Set(tags).size, `level ${level} has duplicate tags`).toBe(tags.length);
		}
	});
});
