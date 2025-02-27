import { TabManager } from './services/TabManager.js';
import { Logger } from './services/Logger.js';
import { SettingsService } from './services/SettingsService.js';

class BackgroundScript {
    constructor() {
        this.tabManager = new TabManager();
        this.logger = Logger.getInstance();
        this.settings = SettingsService.getInstance();
        
        this.initialize();
    }

    async initialize() {
        try {
            const settings = await this.settings.waitForInitialization();
            this.logger.info('Background script initialized with settings:', settings);
            
            this.initializeEventListeners();

            if (!settings.isEnabled) {
                await this.tabManager.cleanup();
            }
        } catch (error) {
            this.logger.error('Error initializing background script:', error);
        }
    }

    initializeEventListeners() {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.handleTabUpdate(tab);
            }
        });

        chrome.runtime.onMessage.addListener((message, sender) => {
            this.handleMessage(message, sender);
        });

        chrome.tabGroups.onRemoved.addListener((group) => {
            this.handleGroupRemoval(group);
        });

        this.tabManager.addObserver({
            update: (event, data) => {
                this.logger.info(`Tab manager event: ${event}`, data);
            }
        });

        this.settings.addObserver({
            update: async (event, data) => {
                if (event === 'settingsUpdated') {
                    this.logger.info('Settings updated', data);
                    if (!data.isEnabled) {
                        await this.tabManager.cleanup();
                    }
                }
            }
        });
    }

    async handleTabUpdate(tab) {
        try {
            if (this.settings.isEnabled()) {
                await this.tabManager.handleTab(tab);
            }
        } catch (error) {
            this.logger.error('Error handling tab update', { error, tab });
        }
    }

    handleGroupRemoval(group) {
        this.tabManager.removeGroup(group.id);
        this.logger.info('Group removed', { groupId: group.id });
    }
}

const backgroundScript = new BackgroundScript(); 