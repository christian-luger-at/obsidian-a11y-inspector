import { Notice, Plugin, TFile } from 'obsidian';
import { AUDIT_RULES, CORE_VIEW_TYPES, runAxe } from './src/rules';
import { formatReport, reportFilename } from './src/report';
import type { PluginReport } from './src/report';

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
	async onload() {
		this.addCommand({
			id: 'run-audit',
			name: 'Run audit',
			callback: () => this.runAudit(),
		});
	}

	onunload() {}

	private async runAudit() {
		new Notice('A11y inspector: scanning plugins…');

		const reports: PluginReport[] = [];

		// Settings-tab sweep — exact plugin attribution via undocumented API
		try {
			const { setting } = this.app as unknown as AppWithSetting;
			if (setting && typeof setting.open === 'function' && Array.isArray(setting.settingTabs)) {
				setting.open();
				await sleep(100);

				for (const tab of setting.settingTabs) {
					if (!tab.id || !tab.containerEl) continue;
					try {
						setting.openTabById(tab.id);
						await sleep(80);
						const { violations } = await runAxe(tab.containerEl, AUDIT_RULES);
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

		// Live-view scan — sequential to avoid concurrent axe runs
		const leaves: { type: string; containerEl: HTMLElement }[] = [];
		this.app.workspace.iterateAllLeaves(leaf => {
			const type = leaf.view.getViewType();
			if (!CORE_VIEW_TYPES.has(type)) {
				leaves.push({ type, containerEl: leaf.view.containerEl });
			}
		});

		for (const { type, containerEl } of leaves) {
			try {
				const { violations } = await runAxe(containerEl, AUDIT_RULES);
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

		const filename = reportFilename();
		const md = formatReport(reports);

		const existing = this.app.vault.getAbstractFileByPath(filename);
		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, md);
		} else {
			await this.app.vault.create(filename, md);
		}

		const file = this.app.vault.getAbstractFileByPath(filename);
		if (file instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(file);
		}

		const totalViolations = reports.reduce((n, r) => n + r.violations.length, 0);
		new Notice(`A11y inspector: done — ${totalViolations} violations in ${reports.length} plugins`);
	}
}
