import type axe from 'axe-core';

export interface PluginReport {
	pluginId: string;
	violations: axe.Violation[];
}

export function formatReport(reports: PluginReport[], date: Date = new Date()): string {
	const dateStr = date.toISOString().slice(0, 10);
	const total = reports.reduce((n, r) => n + r.violations.length, 0);
	const lines: string[] = [
		`# A11y Inspector Report`,
		``,
		`**Date:** ${dateStr}  `,
		`**Plugins scanned:** ${reports.length}  `,
		`**Total violations:** ${total}`,
		``,
	];

	const withViolations = reports.filter(r => r.violations.length > 0);

	if (withViolations.length === 0) {
		lines.push('No violations found. 🎉');
		return lines.join('\n');
	}

	for (const report of withViolations) {
		const count = report.violations.length;
		lines.push(`## ${report.pluginId} (${count} violation${count !== 1 ? 's' : ''})`);
		lines.push('');

		for (const v of report.violations) {
			lines.push(`### \`${v.id}\` — ${v.help}`);
			lines.push('');
			lines.push(`**Impact:** ${v.impact}  `);
			lines.push(`**Reference:** ${v.helpUrl}`);
			lines.push('');
			lines.push('**Affected elements:**');
			lines.push('');

			for (const node of v.nodes) {
				const selector = node.target.join(', ');
				const snippet = node.html.slice(0, 120);
				// failureSummary exists at runtime but is missing from @types/axe-core
				const summary = (node as axe.NodeResult & { failureSummary?: string }).failureSummary;
				lines.push(`- \`${selector}\``);
				lines.push(`  \`\`\`html`);
				lines.push(`  ${snippet}`);
				lines.push(`  \`\`\``);
				if (summary) {
					lines.push(`  ${summary.split('\n')[0]}`);
				}
				lines.push('');
			}

			lines.push('**Issue template (copy to GitHub):**');
			lines.push('');
			lines.push('```markdown');
			lines.push(`## a11y: ${v.nodes.length} element${v.nodes.length !== 1 ? 's' : ''} violate \`${v.id}\``);
			lines.push('');
			lines.push(`Found with [A11y Inspector](https://github.com/christian-luger-at/obsidian-a11y-inspector) (axe-core, rule \`${v.id}\`).`);
			lines.push('');
			lines.push(v.description ?? v.help);
			lines.push('');
			lines.push('**Affected:**');
			for (const node of v.nodes) {
				lines.push(`- \`${node.target.join(', ')}\` — \`${node.html.slice(0, 80)}\``);
			}
			lines.push('');
			lines.push(`Reference: ${v.helpUrl}`);
			lines.push('```');
			lines.push('');
		}
	}

	return lines.join('\n');
}

export function reportFilename(date = new Date()): string {
	return `a11y-report-${date.toISOString().slice(0, 10)}.md`;
}
