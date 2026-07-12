// Minimal Obsidian stubs for unit tests.
// Only the symbols used by the plugin are implemented here.

export class Plugin {
	app: unknown;
	constructor(app: unknown, _manifest: unknown) {
		this.app = app;
	}
	addCommand(_cmd: unknown) {}
	onunload() {}
}

export class Notice {
	constructor(_message: string) {}
}

export class TFile {}
