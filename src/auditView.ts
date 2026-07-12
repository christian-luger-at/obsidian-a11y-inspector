import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian';
import type { PluginReport, AxeViolation } from './report';

export const AUDIT_VIEW_TYPE = 'a11y-inspector-audit';

const IMPACT_CLASS: Record<string, string> = {
	critical: 'a11y-impact--critical',
	serious:  'a11y-impact--serious',
	moderate: 'a11y-impact--moderate',
	minor:    'a11y-impact--minor',
};

export class AuditView extends ItemView {
	private reports: PluginReport[] = [];
	private onRerun: () => void;

	constructor(leaf: WorkspaceLeaf, onRerun: () => void) {
		super(leaf);
		this.onRerun = onRerun;
	}

	getViewType(): string {
		return AUDIT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'A11y inspector';
	}

	getIcon(): string {
		return 'accessibility';
	}

	async onOpen(): Promise<void> {
		this.renderEmpty();
	}

	async onClose(): Promise<void> {}

	update(reports: PluginReport[]): void {
		this.reports = reports;
		this.render();
	}

	private renderEmpty(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('a11y-inspector-view');

		const empty = contentEl.createDiv('a11y-view__empty');
		empty.createEl('p', { text: 'Run an audit to see results.' });
		this.renderRerunButton(contentEl);
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('a11y-inspector-view');

		const total = this.reports.reduce((n, r) => n + r.violations.length, 0);

		const header = contentEl.createDiv('a11y-view__header');
		header.createSpan({
			cls: 'a11y-view__summary',
			text: total === 0
				? 'No violations found.'
				: `${total} violation${total !== 1 ? 's' : ''} in ${this.reports.length} plugin${this.reports.length !== 1 ? 's' : ''}`,
		});
		this.renderRerunButton(header);

		if (total === 0) return;

		const list = contentEl.createDiv('a11y-view__list');
		for (const report of this.reports) {
			if (report.violations.length === 0) continue;
			this.renderPluginSection(list, report);
		}
	}

	private renderRerunButton(parent: HTMLElement): void {
		const btn = parent.createEl('button', {
			cls: 'a11y-view__rerun',
			attr: { 'aria-label': 'Run audit again' },
		});
		setIcon(btn, 'refresh-cw');
		btn.createSpan({ text: 'Run audit' });
		btn.addEventListener('click', () => this.onRerun());
	}

	private renderPluginSection(parent: HTMLElement, report: PluginReport): void {
		const section = parent.createDiv('a11y-view__plugin');
		const heading = section.createEl('h3', { cls: 'a11y-view__plugin-heading' });
		heading.createEl('code', { text: report.pluginId });
		heading.createSpan({
			cls: 'a11y-view__plugin-count',
			text: ` ${report.violations.length} violation${report.violations.length !== 1 ? 's' : ''}`,
		});

		for (const violation of report.violations) {
			this.renderViolation(section, violation);
		}
	}

	private renderViolation(parent: HTMLElement, v: AxeViolation): void {
		const item = parent.createDiv('a11y-view__violation');

		const toggle = item.createEl('button', { cls: 'a11y-view__violation-toggle' });
		const impactCls = IMPACT_CLASS[v.impact ?? ''] ?? 'a11y-impact--minor';
		toggle.createSpan({ cls: `a11y-view__impact ${impactCls}`, text: v.impact ?? '?' });
		toggle.createSpan({ cls: 'a11y-view__rule', text: v.id });
		toggle.createSpan({ cls: 'a11y-view__node-count', text: `${v.nodes.length} node${v.nodes.length !== 1 ? 's' : ''}` });

		const body = item.createDiv('a11y-view__violation-body a11y-view__violation-body--collapsed');

		toggle.addEventListener('click', () => {
			const isCollapsed = body.hasClass('a11y-view__violation-body--collapsed');
			body.toggleClass('a11y-view__violation-body--collapsed', !isCollapsed);
			toggle.toggleClass('is-open', isCollapsed);
		});

		body.createEl('p', { cls: 'a11y-view__help', text: v.help });
		const ref = body.createEl('a', { cls: 'a11y-view__ref', text: 'View rule documentation', href: v.helpUrl });
		ref.setAttr('target', '_blank');
		ref.setAttr('rel', 'noopener');

		const selectorList = body.createEl('ul', { cls: 'a11y-view__selectors' });
		for (const node of v.nodes) {
			selectorList.createEl('li').createEl('code', { text: node.target.join(', ') });
		}

		this.renderIssueTemplate(body, v);
	}

	private renderIssueTemplate(parent: HTMLElement, v: AxeViolation): void {
		const templateSection = parent.createDiv('a11y-view__template');
		const templateHeader = templateSection.createDiv('a11y-view__template-header');
		templateHeader.createSpan({ text: 'GitHub issue template' });

		const copyBtn = templateHeader.createEl('button', {
			cls: 'a11y-view__copy',
			attr: { 'aria-label': 'Copy issue template to clipboard' },
		});
		setIcon(copyBtn, 'copy');
		copyBtn.createSpan({ text: 'Copy' });

		const template = this.buildIssueTemplate(v);

		copyBtn.addEventListener('click', () => {
			navigator.clipboard.writeText(template).then(() => {
				copyBtn.empty();
				setIcon(copyBtn, 'check');
				copyBtn.createSpan({ text: 'Copied!' });
				window.setTimeout(() => {
					copyBtn.empty();
					setIcon(copyBtn, 'copy');
					copyBtn.createSpan({ text: 'Copy' });
				}, 2000);
			}).catch(() => {});
		});

		templateSection.createEl('pre', { cls: 'a11y-view__template-body', text: template });
	}

	private buildIssueTemplate(v: AxeViolation): string {
		const lines: string[] = [
			`## a11y: ${v.nodes.length} element${v.nodes.length !== 1 ? 's' : ''} violate \`${v.id}\``,
			'',
			`Found with [A11y Inspector](https://github.com/christian-luger-at/obsidian-a11y-inspector) (axe-core, rule \`${v.id}\`).`,
			'',
			v.description ?? v.help,
			'',
			'**Affected:**',
			...v.nodes.map(n => `- \`${n.target.join(', ')}\` — \`${n.html.slice(0, 80)}\``),
			'',
			`Reference: ${v.helpUrl}`,
		];
		return lines.join('\n');
	}
}
