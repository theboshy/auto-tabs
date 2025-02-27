import { SettingsService } from './services/SettingsService.js';

class PopupUI {
    constructor() {
        this.settings = SettingsService.getInstance();
        this.toggle = document.getElementById('extensionToggle');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusText = document.getElementById('statusText');
        this.groupCount = document.getElementById('groupCount');
        this.tabCount = document.getElementById('tabCount');
        
        this.initialize();
    }

    async initialize() {
        try {
            const settings = await this.settings.waitForInitialization();
            
            this.initializeUI(settings);
            this.setupEventListeners();
            this.startStatisticsUpdates();

            await this.updateStatistics();
        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }

    initializeUI(settings) {
        this.updateStatusUI(settings.isEnabled);
    }

    setupEventListeners() {
        this.toggle.addEventListener('change', async (event) => {
            try {
                this.toggle.disabled = true;
                const newState = await this.settings.toggleExtension();
                this.updateStatusUI(newState);
                await this.updateStatistics();
            } catch (error) {
                console.error('Error toggling extension:', error);
                // Revert the toggle if there was an error
                event.preventDefault();
                this.updateStatusUI(this.settings.isEnabled());
            } finally {
                this.toggle.disabled = false;
            }
        });

        this.settings.addObserver({
            update: async (event, data) => {
                if (event === 'settingsUpdated' || event === 'settingsLoaded') {
                    this.updateStatusUI(data.isEnabled);
                    await this.updateStatistics();
                }
            }
        });

        chrome.tabs.onUpdated.addListener(() => {
            this.updateStatistics();
        });

        chrome.tabs.onRemoved.addListener(() => {
            this.updateStatistics();
        });

        chrome.tabGroups.onUpdated.addListener(() => {
            this.updateStatistics();
        });
    }

    updateStatusUI(isEnabled) {
        if (this.toggle.checked !== isEnabled) {
            this.toggle.checked = isEnabled;
        }
        this.statusIcon.className = `status-icon status-${isEnabled ? 'active' : 'inactive'}`;
        this.statusText.textContent = `Extension is ${isEnabled ? 'active' : 'inactive'}`;
    }

    startStatisticsUpdates() {
        this.statsInterval = setInterval(() => {
            this.updateStatistics();
        }, 2000);

        window.addEventListener('unload', () => {
            if (this.statsInterval) {
                clearInterval(this.statsInterval);
            }
        });
    }

    async updateStatistics() {
        if (!this.settings.isEnabled()) {
            this.groupCount.textContent = '0';
            this.tabCount.textContent = '0';
            return;
        }

        try {
            const windows = await chrome.windows.getAll({ populate: true });
            
            let groupedTabs = 0;
            const uniqueGroups = new Set();

            for (const window of windows) {
                for (const tab of window.tabs) {
                    if (tab.groupId !== chrome.tabs.TAB_ID_NONE) {
                        groupedTabs++;
                        uniqueGroups.add(tab.groupId);
                    }
                }
            }

            if (this.groupCount.textContent !== uniqueGroups.size.toString()) {
                this.groupCount.textContent = uniqueGroups.size;
            }
            if (this.tabCount.textContent !== groupedTabs.toString()) {
                this.tabCount.textContent = groupedTabs;
            }
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupUI();
}); 