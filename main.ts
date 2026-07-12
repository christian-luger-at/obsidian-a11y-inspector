import { Notice, Plugin, TFile } from 'obsidian';
import { AUDIT_RULES, CORE_VIEW_TYPES, runAxe } from './src/rules';
import { formatReport, reportFilename } from './src/report';
import { DEFAULT_SETTINGS, WCAG_TAGS } from './src/settings';
import { A11yInspectorSettingTab } from './src/settingTab';
import type { PluginReport } from './src/report';
import type { A11yInspectorSettings } from './src/settings';

// Typed interface for the undocumented app.setting API, widely used in the community.
interface ObsidianSettingTab {
	id: string;
	containerEl: HTMLElement;
}
interface ObsidianSetting {
	open(): void;
	close(): void;
	openTabById(id: string): void;
	settingTabs: ObsidianSettingTab[];
}
interface AppWithSetting {
	setting: ObsidianSetting;
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => window.setTimeout(resolve, ms));
}

export default class A11yInspectorPlugin extends Plugin {
	settings!: A11yInspectorSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new A11yInspectorSettingTab(this.app, this));
		this.addCommand({
			id: 'run-audit',
			name: 'Run audit',
			callback: () => this.runAudit(),
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<A11yInspectorSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private effectiveRules(): string[] {
		const tags = WCAG_TAGS[this.settings.wcagLevel];
		if (this.settings.bestPractices) {
			return [...AUDIT_RULES];
		}
		// Filter AUDIT_RULES to those matching the selected WCAG tags.
		// For now we run all curated rules regardless — WCAG tag filtering
		// is applied via runOnly tags in a future iteration (#1).
		void tags;
		return [...AUDIT_RULES];
	}

	private reportPath(filename: string): string {
		const folder = this.settings.reportFolder.trim();
		return folder ? `${folder}/${filename}` : filename;
	}

	private async runAudit() {
		new Notice('A11y inspector: scanning plugins…');

		const reports: PluginReport[] = [];
		const rules = this.effectiveRules();
		const targetId = this.settings.targetPluginId;

		try {
			const { setting } = this.app as unknown as AppWithSetting;
			if (setting && typeof setting.open === 'function' && Array.isArray(setting.settingTabs)) {
				setting.open();
				await sleep(100);

				const tabs = targetId
					? setting.settingTabs.filter(t => t.id === targetId)
					: setting.settingTabs;

				for (const tab of tabs) {
					if (!tab.id || !tab.containerEl) continue;
					try {
						setting.openTabById(tab.id);
						await sleep(80);
						const { violations } = await runAxe(tab.containerEl, rules);
						if (violations.length > 0) {
							reports.push({ pluginId: tab.id, violations });
						}
					} catch {
						// skip tabs that fail to render
					}
				}

				setting.close();
			}
		} catch {
			// app.setting unavailable — skip sweep
		}

		// Live-view scan — only when no specific target is set
		if (!targetId) {
			const leaves: { type: string; containerEl: HTMLElement }[] = [];
			this.app.workspace.iterateAllLeaves(leaf => {
				const type = leaf.view.getViewType();
				if (!CORE_VIEW_TYPES.has(type)) {
					leaves.push({ type, containerEl: leaf.view.containerEl });
				}
			});

			for (const { type, containerEl } of leaves) {
				try {
					const { violations } = await runAxe(containerEl, rules);
					if (violations.length > 0) {
						const existing = reports.find(r => r.pluginId === type);
						if (existing) {
							existing.violations.push(...violations);
						} else {
							reports.push({ pluginId: type, violations });
						}
					}
				} catch {
					// skip leaves that fail
				}
			}
		}

		const filename = reportFilename();
		const path = this.reportPath(filename);
		const md = formatReport(reports);

		// Ensure report folder exists
		if (this.settings.reportFolder.trim()) {
			const folder = this.app.vault.getFolderByPath(this.settings.reportFolder.trim());
			if (!folder) {
				await this.app.vault.createFolder(this.settings.reportFolder.trim());
			}
		}

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, md);
		} else {
			await this.app.vault.create(path, md);
		}

		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(file);
		}

		const totalViolations = reports.reduce((n, r) => n + r.violations.length, 0);
		new Notice(`A11y inspector: done — ${totalViolations} violations in ${reports.length} plugins`);
	}
}
