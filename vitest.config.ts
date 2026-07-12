import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/tests/**/*.test.ts'],
		alias: {
			obsidian: fileURLToPath(new URL('./src/tests/__mocks__/obsidian.ts', import.meta.url)),
		},
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/tests/**'],
			all: true,
			reporter: ['text', 'json-summary'],
			thresholds: {
				perFile: true,
				statements: 80,
				lines: 80,
				branches: 80,
				functions: 80,
			},
		},
	},
});
