import { Notice, Plugin, TFile } from 'obsidian';
import axe from 'axe-core';
import { AUDIT_RULES, CORE_VIEW_TYPES } from './src/rules';
import { formatReport, reportFilename } from './src/report';
import type { PluginReport } from './src/report';

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
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
		new Notice('A11y Inspector: scanning plugins…');

		const reports: PluginReport[] = [];

		// Settings-tab sweep — exact plugin attribution via undocumented API
		try {
			// @ts-ignore — undocumented but widely used community API
			const setting = this.app.setting;
			if (setting && typeof setting.open === 'function' && Array.isArray(setting.settingTabs)) {
				setting.open();
				await sleep(100);

				for (const tab of setting.settingTabs) {
					if (!tab.id || !tab.containerEl) continue;
					try {
						setting.openTabById(tab.id);
						await sleep(80);
						const results = await axe.run(tab.containerEl, {
							runOnly: { type: 'rule', values: [...AUDIT_RULES] },
						});
						if (results.violations.length > 0) {
							reports.push({ pluginId: tab.id, violations: results.violations });
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
				const results = await axe.run(containerEl, {
					runOnly: { type: 'rule', values: [...AUDIT_RULES] },
				});
				if (results.violations.length > 0) {
					const existing = reports.find(r => r.pluginId === type);
					if (existing) {
						existing.violations.push(...results.violations);
					} else {
						reports.push({ pluginId: type, violations: results.violations });
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
		new Notice(`A11y Inspector: done — ${totalViolations} violations in ${reports.length} plugins`);
	}
}
