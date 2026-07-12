import { Notice, Plugin, TFile } from 'obsidian';
import { CORE_VIEW_TYPES, runAxe } from './src/rules';
import { formatReport, reportFilename } from './src/report';
import { DEFAULT_SETTINGS, WCAG_TAGS } from './src/settings';
import { A11yInspectorSettingTab } from './src/settingTab';
import { AuditView, AUDIT_VIEW_TYPE } from './src/auditView';
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
		this.registerView(AUDIT_VIEW_TYPE, leaf => new AuditView(
			leaf,
			() => void this.runAudit(),
			(selector) => this.highlightElement(selector),
		));
		this.addCommand({
			id: 'run-audit',
			name: 'Run audit',
			callback: () => void this.runAudit(),
		});
		this.addCommand({
			id: 'open-view',
			name: 'Open sidebar view',
			callback: () => void this.openView(),
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

	private effectiveTags(): string[] {
		const tags = [...WCAG_TAGS[this.settings.wcagLevel]];
		if (this.settings.bestPractices) tags.push('best-practice');
		return tags;
	}

	async openView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(AUDIT_VIEW_TYPE);
		if (existing.length > 0) {
			await this.app.workspace.revealLeaf(existing[0]!);
			return;
		}
		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: AUDIT_VIEW_TYPE, active: true });
			await this.app.workspace.revealLeaf(leaf);
		}
	}

	private highlightElement(selector: string): void {
		const el = document.querySelector(selector);
		if (!el) {
			new Notice(`A11y inspector: element not found — is the plugin's UI currently open?\n${selector}`);
			return;
		}
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		el.classList.add('a11y-inspector--highlight');
		window.setTimeout(() => { el.classList.remove('a11y-inspector--highlight'); }, 2000);
	}

	private getAuditView(): AuditView | null {
		const leaves = this.app.workspace.getLeavesOfType(AUDIT_VIEW_TYPE);
		const view = leaves[0]?.view;
		return view instanceof AuditView ? view : null;
	}

	private reportPath(filename: string): string {
		const folder = this.settings.reportFolder.trim();
		return folder ? `${folder}/${filename}` : filename;
	}

	private async runAudit() {
		new Notice('A11y inspector: scanning plugins…');

		const reports: PluginReport[] = [];
		const tags = this.effectiveTags();
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
						const { violations } = await runAxe(tab.containerEl, tags);
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
					const { violations } = await runAxe(containerEl, tags);
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

		// Update sidebar view if open, otherwise open it
		const view = this.getAuditView();
		if (view) {
			view.update(reports);
		} else {
			await this.openView();
			this.getAuditView()?.update(reports);
		}

		const totalViolations = reports.reduce((n, r) => n + r.violations.length, 0);
		new Notice(`A11y inspector: done — ${totalViolations} violations in ${reports.length} plugins`);
	}
}
