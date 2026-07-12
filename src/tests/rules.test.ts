import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CORE_VIEW_TYPES } from '../rules';

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

describe('runAxe', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('returns violations from axe.run', async () => {
		const fakeViolation = { id: 'button-name', nodes: [] };
		vi.doMock('axe-core', () => ({
			default: { run: vi.fn().mockResolvedValue({ violations: [fakeViolation] }) },
		}));
		const { runAxe: runAxeMocked } = await import('../rules');
		const result = await runAxeMocked({} as HTMLElement, ['wcag2a', 'wcag21a']);
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0]?.id).toBe('button-name');
	});

	it('passes tags to axe runOnly', async () => {
		const mockRun = vi.fn().mockResolvedValue({ violations: [] });
		vi.doMock('axe-core', () => ({ default: { run: mockRun } }));
		const { runAxe: runAxeMocked } = await import('../rules');
		await runAxeMocked({} as HTMLElement, ['wcag2a', 'best-practice']);
		expect(mockRun).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				runOnly: { type: 'tag', values: ['wcag2a', 'best-practice'] },
			}),
		);
	});

	it('always disables color-contrast rule', async () => {
		const mockRun = vi.fn().mockResolvedValue({ violations: [] });
		vi.doMock('axe-core', () => ({ default: { run: mockRun } }));
		const { runAxe: runAxeMocked } = await import('../rules');
		await runAxeMocked({} as HTMLElement, ['wcag2a']);
		const opts = mockRun.mock.calls[0]?.[1] as { rules?: Record<string, { enabled: boolean }> };
		expect(opts.rules?.['color-contrast']?.enabled).toBe(false);
	});
});
