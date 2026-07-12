import { describe, it, expect, vi, beforeEach } from 'vitest';
import { A11yInspectorSettingTab } from '../settingTab';
import { DEFAULT_SETTINGS } from '../settings';
import { Setting } from 'obsidian';
import type { A11yInspectorSettings } from '../settings';

// Access the mock Setting's captured controls
type MockSetting = InstanceType<typeof Setting> & {
	lastDropdown?: { triggerChange(v: string): void; getValue(): string };
	lastToggle?: { triggerChange(v: boolean): void; getValue(): boolean };
	lastText?: { triggerBlur(): void; getValue(): string; setValue(v: string): unknown };
};

let capturedSettings: MockSetting[] = [];
const OriginalSetting = Setting as unknown as new (el: HTMLElement) => MockSetting;

vi.mock('obsidian', async (importOriginal) => {
	const original = await importOriginal<typeof import('obsidian')>();
	const TrackedSetting = class extends (original.Setting as unknown as new (el: HTMLElement) => MockSetting) {
		constructor(el: HTMLElement) {
			super(el);
			capturedSettings.push(this);
		}
	};
	return { ...original, Setting: TrackedSetting };
});

void OriginalSetting;

function makePlugin(overrides: Partial<A11yInspectorSettings> = {}) {
	const settings: A11yInspectorSettings = { ...DEFAULT_SETTINGS, ...overrides };
	return {
		settings,
		saveSettings: vi.fn().mockResolvedValue(undefined),
	};
}

function makeApp(manifests: Record<string, { name: string }> = {}) {
	return { plugins: { manifests } };
}

function makeTab(
	plugin: ReturnType<typeof makePlugin>,
	app: ReturnType<typeof makeApp> = makeApp(),
) {
	capturedSettings = [];
	const tab = new A11yInspectorSettingTab(app as never, plugin as never);
	tab.display();
	return { tab, settings: capturedSettings };
}

describe('A11yInspectorSettingTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedSettings = [];
	});

	it('renders without throwing', () => {
		expect(() => makeTab(makePlugin())).not.toThrow();
	});

	it('renders when app.plugins is unavailable', () => {
		expect(() => makeTab(makePlugin(), {} as ReturnType<typeof makeApp>)).not.toThrow();
	});

	it('saves target plugin id on change', async () => {
		const plugin = makePlugin();
		const { settings } = makeTab(plugin);
		settings[0]?.lastDropdown?.triggerChange('dataview');
		await vi.waitFor(() => expect(plugin.saveSettings).toHaveBeenCalled());
		expect(plugin.settings.targetPluginId).toBe('dataview');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('saves conformance level on change', async () => {
		const plugin = makePlugin();
		const { settings } = makeTab(plugin);
		settings[1]?.lastDropdown?.triggerChange('A');
		await vi.waitFor(() => expect(plugin.saveSettings).toHaveBeenCalled());
		expect(plugin.settings.wcagLevel).toBe('A');
	});

	it('saves best practices toggle on change', async () => {
		const plugin = makePlugin();
		const { settings } = makeTab(plugin);
		settings[2]?.lastToggle?.triggerChange(true);
		await vi.waitFor(() => expect(plugin.saveSettings).toHaveBeenCalled());
		expect(plugin.settings.bestPractices).toBe(true);
	});

	it('saves report folder on blur', async () => {
		const plugin = makePlugin();
		const { settings } = makeTab(plugin);
		settings[3]?.lastText?.setValue('audits/a11y');
		settings[3]?.lastText?.triggerBlur();
		await vi.waitFor(() => expect(plugin.saveSettings).toHaveBeenCalled());
		expect(plugin.settings.reportFolder).toBe('audits/a11y');
	});

	it('trims whitespace from report folder', async () => {
		const plugin = makePlugin();
		const { settings } = makeTab(plugin);
		settings[3]?.lastText?.setValue('  audits  ');
		settings[3]?.lastText?.triggerBlur();
		await vi.waitFor(() => expect(plugin.saveSettings).toHaveBeenCalled());
		expect(plugin.settings.reportFolder).toBe('audits');
	});

	it('defaults target plugin dropdown to empty string', () => {
		const plugin = makePlugin();
		makeTab(plugin);
		expect(plugin.settings.targetPluginId).toBe('');
	});

	it('defaults conformance level to AA', () => {
		const plugin = makePlugin();
		makeTab(plugin);
		expect(plugin.settings.wcagLevel).toBe('AA');
	});
});
