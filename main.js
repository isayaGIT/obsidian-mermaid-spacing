var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MermaidGlobalLayoutPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  nodeSpacing: 20,
  rankSpacing: 25
};
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeConfig(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const previous = result[key];
    result[key] = isPlainObject(previous) && isPlainObject(value) ? mergeConfig(previous, value) : value;
  }
  return result;
}
var MermaidGlobalLayoutPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.api = null;
    this.originalInitialize = null;
    this.baseConfig = {};
  }
  async onload() {
    await this.loadSettings();
    await this.installMermaidHook();
    this.addSettingTab(
      new MermaidGlobalLayoutSettingTab(this.app, this)
    );
    this.rerenderMarkdownViews();
  }
  onunload() {
    this.uninstallMermaidHook();
  }
  getLayoutConfig() {
    return {
      flowchart: {
        nodeSpacing: this.settings.nodeSpacing,
        rankSpacing: this.settings.rankSpacing
      }
    };
  }
  async installMermaidHook() {
    var _a;
    const api = await (0, import_obsidian.loadMermaid)();
    const original = api.initialize.bind(api);
    this.api = api;
    this.originalInitialize = original;
    try {
      const current = (_a = api.getConfig) == null ? void 0 : _a.call(api);
      this.baseConfig = isPlainObject(current) ? { ...current } : {};
    } catch (e) {
      this.baseConfig = {};
    }
    api.initialize = (incoming) => {
      const nextBase = isPlainObject(incoming) ? incoming : {};
      this.baseConfig = nextBase;
      original(mergeConfig(nextBase, this.getLayoutConfig()));
    };
    original(mergeConfig(this.baseConfig, this.getLayoutConfig()));
  }
  uninstallMermaidHook() {
    if (this.api && this.originalInitialize) {
      this.api.initialize = this.originalInitialize;
      try {
        this.originalInitialize(this.baseConfig);
      } catch (e) {
      }
    }
    this.api = null;
    this.originalInitialize = null;
    this.baseConfig = {};
  }
  applySettingsToMermaid() {
    if (!this.originalInitialize) {
      return;
    }
    this.originalInitialize(
      mergeConfig(this.baseConfig, this.getLayoutConfig())
    );
  }
  rerenderMarkdownViews() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      var _a;
      if (leaf.view.getViewType() !== "markdown") {
        return;
      }
      const view = leaf.view;
      if (typeof ((_a = view.previewMode) == null ? void 0 : _a.rerender) === "function") {
        view.previewMode.rerender(true);
      }
    });
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      data != null ? data : {}
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.applySettingsToMermaid();
    this.rerenderMarkdownViews();
  }
};
var MermaidGlobalLayoutSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", {
      text: "Mermaid Global Layout"
    });
    containerEl.createEl("p", {
      text: "Equivalent to adding %%{init: {'flowchart': {'nodeSpacing': N, 'rankSpacing': M}}}%% to every Mermaid flowchart."
    });
    new import_obsidian.Setting(containerEl).setName("Node spacing").setDesc(
      "Horizontal spacing between nodes (default Mermaid: 50)."
    ).addText((text) => {
      text.setPlaceholder("20").setValue(
        String(this.plugin.settings.nodeSpacing)
      ).onChange(async (value) => {
        const number = Number(value);
        if (Number.isFinite(number) && number >= 0) {
          this.plugin.settings.nodeSpacing = number;
          await this.plugin.saveSettings();
        }
      });
    });
    new import_obsidian.Setting(containerEl).setName("Rank spacing").setDesc(
      "Vertical spacing between flowchart ranks (default Mermaid: 50)."
    ).addText((text) => {
      text.setPlaceholder("25").setValue(
        String(this.plugin.settings.rankSpacing)
      ).onChange(async (value) => {
        const number = Number(value);
        if (Number.isFinite(number) && number >= 0) {
          this.plugin.settings.rankSpacing = number;
          await this.plugin.saveSettings();
        }
      });
    });
  }
};
