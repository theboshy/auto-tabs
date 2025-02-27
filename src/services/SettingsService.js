export class SettingsService {
    static instance = null;
    
    constructor() {
        if (SettingsService.instance) {
            return SettingsService.instance;
        }
        this.observers = new Set();
        this.settings = null;
        this.initialized = false;
        this.initializationPromise = null;
        SettingsService.instance = this;
        this.initialize();
    }

    static getInstance() {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService();
        }
        return SettingsService.instance;
    }

    addObserver(observer) {
        this.observers.add(observer);
        // If we're already initialized, immediately notify the new observer
        if (this.initialized && this.settings) {
            observer.update('settingsLoaded', this.settings);
        }
    }

    removeObserver(observer) {
        this.observers.delete(observer);
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => observer.update(event, data));
    }

    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.loadSettings();
        await this.initializationPromise;
        this.initialized = true;

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.isEnabled) {
                this.settings.isEnabled = changes.isEnabled.newValue;
                this.notifyObservers('settingsUpdated', this.settings);
            }
        });

        return this.settings;
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get({
                isEnabled: true,
                groupingThreshold: 2
            });
            this.settings = result;
            this.notifyObservers('settingsLoaded', this.settings);
            return this.settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = { isEnabled: true, groupingThreshold: 2 };
            return this.settings;
        }
    }

    async saveSettings(settings) {
        try {
            await chrome.storage.local.set(settings);
            this.settings = { ...this.settings, ...settings };
            this.notifyObservers('settingsUpdated', this.settings);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    async toggleExtension() {
        const newState = !this.settings.isEnabled;
        const success = await this.saveSettings({ isEnabled: newState });
        if (success) {
            return newState;
        }
        return this.settings.isEnabled;
    }

    isEnabled() {
        return this.settings?.isEnabled ?? true;
    }

    async waitForInitialization() {
        if (this.initialized && this.settings) {
            return this.settings;
        }
        return this.initialize();
    }
} 