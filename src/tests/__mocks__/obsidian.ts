// Minimal Obsidian stubs for unit tests.
// Only the symbols used by the plugin are implemented here.

export class Plugin {
	app: unknown;
	constructor(app: unknown, _manifest: unknown) {
		this.app = app;
	}
	addCommand(_cmd: unknown) {}
	addSettingTab(_tab: unknown) {}
	async loadData(): Promise<unknown> { return undefined; }
	async saveData(_data: unknown): Promise<void> {}
	onunload() {}
}

export class Notice {
	constructor(_message: string) {}
}

export class TFile {}

type DropdownCallback = (value: string) => void;
type ToggleCallback = (value: boolean) => void;

class MockDropdown {
	private value = '';
	private cb?: DropdownCallback;
	addOption(_value: string, _display: string) { return this; }
	setValue(value: string) { this.value = value; return this; }
	getValue() { return this.value; }
	onChange(cb: DropdownCallback) { this.cb = cb; return this; }
	triggerChange(value: string) { this.value = value; this.cb?.(value); }
}

class MockToggle {
	private value = false;
	private cb?: ToggleCallback;
	setValue(value: boolean) { this.value = value; return this; }
	getValue() { return this.value; }
	onChange(cb: ToggleCallback) { this.cb = cb; return this; }
	triggerChange(value: boolean) { this.value = value; this.cb?.(value); }
}

class MockText {
	inputEl = { addEventListener: (_evt: string, cb: () => void) => { this._blurCb = cb; } };
	private _blurCb?: () => void;
	private value = '';
	setPlaceholder(_p: string) { return this; }
	setValue(value: string) { this.value = value; return this; }
	getValue() { return this.value; }
	triggerBlur() { this._blurCb?.(); }
}

export class Setting {
	lastDropdown?: MockDropdown;
	lastToggle?: MockToggle;
	lastText?: MockText;

	constructor(_containerEl: HTMLElement) {}
	setName(_name: string) { return this; }
	setDesc(_desc: string) { return this; }
	addDropdown(cb: (drop: MockDropdown) => void) {
		this.lastDropdown = new MockDropdown();
		cb(this.lastDropdown);
		return this;
	}
	addToggle(cb: (toggle: MockToggle) => void) {
		this.lastToggle = new MockToggle();
		cb(this.lastToggle);
		return this;
	}
	addText(cb: (text: MockText) => void) {
		this.lastText = new MockText();
		cb(this.lastText);
		return this;
	}
}

export class PluginSettingTab {
	containerEl: HTMLElement;
	app: unknown;
	constructor(app: unknown, _plugin: unknown) {
		this.app = app;
		this.containerEl = {
			empty: () => {},
		} as unknown as HTMLElement;
	}
}
