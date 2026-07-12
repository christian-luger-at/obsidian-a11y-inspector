// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditView } from '../auditView';
import { WorkspaceLeaf } from 'obsidian';
import type { PluginReport } from '../report';

function makeLeaf(): WorkspaceLeaf {
	return new WorkspaceLeaf();
}

function makeReport(pluginId: string, count = 1): PluginReport {
	return {
		pluginId,
		violations: Array.from({ length: count }, (_, i) => ({
			id: `rule-${i}`,
			impact: 'serious',
			help: `Fix rule ${i}`,
			helpUrl: `https://dequeuniversity.com/rules/axe/rule-${i}`,
			description: `Description for rule ${i}`,
			nodes: [
				{ target: ['.some-el'], html: '<button></button>', failureSummary: 'Fix 1' },
			],
		})),
	};
}

describe('AuditView', () => {
	let view: AuditView;
	let onRerun: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onRerun = vi.fn();
		view = new AuditView(makeLeaf(), onRerun);
	});

	it('returns correct view type', () => {
		expect(view.getViewType()).toBe('a11y-inspector-audit');
	});

	it('returns display text', () => {
		expect(view.getDisplayText()).toBe('A11y inspector');
	});

	it('returns icon', () => {
		expect(view.getIcon()).toBe('accessibility');
	});

	it('renders empty state on open', async () => {
		await view.onOpen();
		expect(view.contentEl.textContent).toContain('Run an audit');
	});

	it('renders violation count after update with violations', () => {
		view.update([makeReport('test-plugin', 2)]);
		expect(view.contentEl.textContent).toContain('2 violations');
	});

	it('renders "No violations found" when no violations', () => {
		view.update([{ pluginId: 'test-plugin', violations: [] }]);
		expect(view.contentEl.textContent).toContain('No violations found');
	});

	it('renders plugin id in heading', () => {
		view.update([makeReport('dataview')]);
		expect(view.contentEl.textContent).toContain('dataview');
	});

	it('renders rule id in violation toggle', () => {
		view.update([makeReport('my-plugin')]);
		expect(view.contentEl.textContent).toContain('rule-0');
	});

	it('renders node count in violation toggle', () => {
		view.update([makeReport('my-plugin')]);
		expect(view.contentEl.textContent).toContain('1 node');
	});

	it('renders plural node count', () => {
		const report: PluginReport = {
			pluginId: 'my-plugin',
			violations: [{
				id: 'rule-x',
				impact: 'critical',
				help: 'Help text',
				helpUrl: 'https://example.com',
				description: 'Desc',
				nodes: [
					{ target: ['.a'], html: '<a>', failureSummary: 'Fix' },
					{ target: ['.b'], html: '<b>', failureSummary: 'Fix' },
				],
			}],
		};
		view.update([report]);
		expect(view.contentEl.textContent).toContain('2 nodes');
	});

	it('renders "no violations" message for multiple plugins all empty', () => {
		view.update([
			{ pluginId: 'plugin-a', violations: [] },
			{ pluginId: 'plugin-b', violations: [] },
		]);
		expect(view.contentEl.textContent).toContain('No violations found');
	});

	it('renders impact badge', () => {
		view.update([makeReport('my-plugin')]);
		expect(view.contentEl.textContent).toContain('serious');
	});

	it('renders fallback impact when undefined', () => {
		const report: PluginReport = {
			pluginId: 'my-plugin',
			violations: [{
				id: 'rule-x',
				impact: undefined,
				help: 'Help',
				helpUrl: 'https://example.com',
				description: 'Desc',
				nodes: [{ target: ['.el'], html: '<div>', failureSummary: 'Fix' }],
			}],
		};
		view.update([report]);
		expect(view.contentEl.textContent).toContain('?');
	});

	it('renders singular "violation" for single violation', () => {
		view.update([makeReport('my-plugin', 1)]);
		expect(view.contentEl.textContent).toContain('1 violation');
		// "1 violations" should not appear as a standalone word (avoid false positive from "1 violationseriou...")
		expect(view.contentEl.textContent).not.toMatch(/1 violations\s/);
	});

	it('renders singular "plugin" for single plugin', () => {
		view.update([makeReport('my-plugin', 1)]);
		expect(view.contentEl.textContent).toContain('1 plugin');
		expect(view.contentEl.textContent).not.toMatch(/1 plugins/);
	});

	it('calls onRerun when rerun button is clicked', async () => {
		await view.onOpen();
		const btn = view.contentEl.querySelector('button.a11y-view__rerun') as HTMLButtonElement;
		btn?.click();
		expect(onRerun).toHaveBeenCalled();
	});

	it('calls onClose without error', async () => {
		await expect(view.onClose()).resolves.toBeUndefined();
	});

	it('toggle click expands violation body', () => {
		view.update([makeReport('my-plugin')]);
		const toggle = view.contentEl.querySelector('button.a11y-view__violation-toggle') as HTMLButtonElement;
		const body = view.contentEl.querySelector('.a11y-view__violation-body') as HTMLElement;
		expect(body.classList.contains('a11y-view__violation-body--collapsed')).toBe(true);
		toggle?.click();
		expect(body.classList.contains('a11y-view__violation-body--collapsed')).toBe(false);
	});

	it('toggle click collapses expanded violation body', () => {
		view.update([makeReport('my-plugin')]);
		const toggle = view.contentEl.querySelector('button.a11y-view__violation-toggle') as HTMLButtonElement;
		const body = view.contentEl.querySelector('.a11y-view__violation-body') as HTMLElement;
		toggle?.click(); // expand
		toggle?.click(); // collapse
		expect(body.classList.contains('a11y-view__violation-body--collapsed')).toBe(true);
	});

	it('filters out plugins with no violations in render', () => {
		view.update([
			{ pluginId: 'ok-plugin', violations: [] },
			makeReport('bad-plugin', 1),
		]);
		expect(view.contentEl.textContent).toContain('bad-plugin');
		expect(view.contentEl.textContent).not.toContain('ok-plugin');
	});
});
