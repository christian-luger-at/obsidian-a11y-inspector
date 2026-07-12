export const AUDIT_RULES = [
	'aria-input-field-name',
	'label',
	'scrollable-region-focusable',
	'aria-prohibited-attr',
	'button-name',
	'link-name',
	'image-alt',
	'aria-valid-attr-value',
	'aria-required-attr',
] as const;

export type AuditRule = (typeof AUDIT_RULES)[number];

export const CORE_VIEW_TYPES = new Set([
	'empty',
	'markdown',
	'file-explorer',
	'search',
	'outline',
	'backlink',
	'tag',
]);
