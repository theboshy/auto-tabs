import { TabManager } from './services/TabManager.js';
import { ColorService } from './services/ColorService.js';
import { Logger } from './services/Logger.js';

class BackgroundScript {
    constructor() {
        this.tabManager = new TabManager();
        this.colorService = ColorService.getInstance();
        this.logger = Logger.getInstance();
        
        this.initializeEventListeners();
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
    }

    async handleTabUpdate(tab) {
        try {
            await this.tabManager.handleTab(tab);
        } catch (error) {
            this.logger.error('Error handling tab update', { error, tab });
        }
    }

    handleMessage(message, sender) {
        if (message.type === 'primaryColor' && sender.tab) {
            const domain = this.tabManager.extractDomain(message.url);
            if (domain) {
                const chromeColor = this.colorService.findClosestChromeColor(message.color);
                this.tabManager.setTabColor(domain, chromeColor);
                this.logger.info('Color updated for domain', { domain, color: chromeColor });
            }
        }
    }

    handleGroupRemoval(group) {
        this.tabManager.removeGroup(group.id);
        this.logger.info('Group removed', { groupId: group.id });
    }
}

const backgroundScript = new BackgroundScript(); 