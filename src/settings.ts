export type WcagLevel = 'A' | 'AA';

export interface A11yInspectorSettings {
	targetPluginId: string;
	wcagLevel: WcagLevel;
	bestPractices: boolean;
	reportFolder: string;
}

export const DEFAULT_SETTINGS: A11yInspectorSettings = {
	targetPluginId: '',
	wcagLevel: 'AA',
	bestPractices: false,
	reportFolder: '',
};

export const WCAG_TAGS: Record<WcagLevel, string[]> = {
	A:  ['wcag2a', 'wcag21a'],
	AA: ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
};
