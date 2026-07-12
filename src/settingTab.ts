import { App, PluginSettingTab, Setting } from 'obsidian';
import type A11yInspectorPlugin from '../main';
import type { WcagLevel } from './settings';

// Typed interface for the undocumented app.plugins API.
interface AppWithPlugins {
	plugins: {
		manifests: Record<string, { name: string }>;
	};
}

export class A11yInspectorSettingTab extends PluginSettingTab {
	private plugin: A11yInspectorPlugin;

	constructor(app: App, plugin: A11yInspectorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.renderTargetPluginSetting(containerEl);
		this.renderWcagLevelSetting(containerEl);
		this.renderBestPracticesSetting(containerEl);
		this.renderReportFolderSetting(containerEl);
	}

	private renderTargetPluginSetting(containerEl: HTMLElement): void {
		const manifests = (this.app as unknown as AppWithPlugins).plugins?.manifests ?? {};
		const pluginOptions: Record<string, string> = { '': '— All installed plugins —' };
		for (const [id, manifest] of Object.entries(manifests)) {
			pluginOptions[id] = manifest.name;
		}

		new Setting(containerEl)
			.setName('Target plugin')
			.setDesc('Audit only this plugin. Leave blank to scan all installed plugins.')
			.addDropdown(drop => {
				for (const [id, name] of Object.entries(pluginOptions)) {
					drop.addOption(id, name);
				}
				drop.setValue(this.plugin.settings.targetPluginId);
				drop.onChange(async (value) => {
					this.plugin.settings.targetPluginId = value;
					await this.plugin.saveSettings();
				});
			});
	}

	private renderWcagLevelSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Conformance level')
			.setDesc('Accessibility standard to check against. The higher level also runs all lower-level checks.')
			.addDropdown(drop => {
				drop.addOption('A', 'Minimum');
				drop.addOption('AA', 'Recommended');
				drop.setValue(this.plugin.settings.wcagLevel);
				drop.onChange(async (value) => {
					this.plugin.settings.wcagLevel = value as WcagLevel;
					await this.plugin.saveSettings();
				});
			});
	}

	private renderBestPracticesSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Include best practices')
			.setDesc('Add common best-practice rules on top of the selected conformance level. These rules are not part of the accessibility standard.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.bestPractices);
				toggle.onChange(async (value) => {
					this.plugin.settings.bestPractices = value;
					await this.plugin.saveSettings();
				});
			});
	}

	private renderReportFolderSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Report folder')
			.setDesc('Folder inside the vault where audit reports are saved. Leave blank to save in the vault root.')
			.addText(text => {
				text
					.setPlaceholder('Audits/a11y')
					.setValue(this.plugin.settings.reportFolder);
				text.inputEl.addEventListener('blur', () => {
					this.plugin.settings.reportFolder = text.getValue().trim();
					this.plugin.saveSettings().catch(() => {});
				});
			});
	}
}
