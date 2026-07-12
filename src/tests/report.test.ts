import { describe, it, expect } from 'vitest';
import { formatReport, reportFilename, PluginReport } from '../report';
import type axe from 'axe-core';

function makeViolation(overrides: Partial<axe.Violation> = {}): axe.Violation {
	return {
		id: 'button-name',
		impact: 'critical',
		help: 'Buttons must have an accessible name',
		helpUrl: 'https://dequeuniversity.com/rules/axe/4.x/button-name',
		description: 'Ensures buttons have discernible text',
		tags: ['wcag2a'],
		nodes: [makeNode()],
		...overrides,
	} as axe.Violation;
}

function makeNode(overrides: Partial<axe.NodeResult> = {}): axe.NodeResult {
	return {
		html: '<button class="icon-btn"></button>',
		target: ['.icon-btn'],
		failureSummary: 'Fix any of the following: Element does not have inner text',
		any: [],
		all: [],
		none: [],
		...overrides,
	} as axe.NodeResult;
}

describe('reportFilename', () => {
	it('produces a date-stamped filename', () => {
		const date = new Date('2025-03-15T12:00:00Z');
		expect(reportFilename(date)).toBe('a11y-report-2025-03-15.md');
	});
});

describe('formatReport', () => {
	it('shows a success message when there are no violations', () => {
		const result = formatReport([]);
		expect(result).toContain('No violations found');
	});

	it('includes total count and plugin count in the header', () => {
		const reports: PluginReport[] = [
			{ pluginId: 'my-plugin', violations: [makeViolation(), makeViolation()] },
		];
		const result = formatReport(reports);
		expect(result).toContain('**Total violations:** 2');
		expect(result).toContain('**Plugins scanned:** 1');
	});

	it('groups violations under the correct plugin heading', () => {
		const reports: PluginReport[] = [
			{ pluginId: 'my-plugin', violations: [makeViolation()] },
		];
		const result = formatReport(reports);
		expect(result).toContain('## my-plugin');
		expect(result).toContain('`button-name`');
	});

	it('uses singular "violation" for exactly one violation', () => {
		const reports: PluginReport[] = [
			{ pluginId: 'my-plugin', violations: [makeViolation()] },
		];
		expect(formatReport(reports)).toContain('1 violation)');
	});

	it('uses plural "violations" for more than one', () => {
		const reports: PluginReport[] = [
			{ pluginId: 'my-plugin', violations: [makeViolation(), makeViolation()] },
		];
		expect(formatReport(reports)).toContain('2 violations)');
	});

	it('includes a GitHub issue template block per violation', () => {
		const reports: PluginReport[] = [
			{ pluginId: 'my-plugin', violations: [makeViolation()] },
		];
		const result = formatReport(reports);
		expect(result).toContain('Issue template (copy to GitHub)');
		expect(result).toContain('A11y Inspector');
		expect(result).toContain('dequeuniversity.com');
	});

	it('renders affected node selectors in the issue template', () => {
		const node = makeNode({ target: ['.my-button'] });
		const reports: PluginReport[] = [
			{ pluginId: 'my-plugin', violations: [makeViolation({ nodes: [node] })] },
		];
		const result = formatReport(reports);
		expect(result).toContain('.my-button');
	});

	it('skips plugins with no violations', () => {
		const reports: PluginReport[] = [
			{ pluginId: 'clean-plugin', violations: [] },
			{ pluginId: 'buggy-plugin', violations: [makeViolation()] },
		];
		const result = formatReport(reports);
		expect(result).not.toContain('## clean-plugin');
		expect(result).toContain('## buggy-plugin');
	});

	it('uses the provided date for the header', () => {
		const date = new Date('2024-01-01T00:00:00Z');
		const result = formatReport([], date);
		expect(result).toContain('2024-01-01');
	});
});
