import { SettingsService } from './SettingsService.js';
import { Logger } from './Logger.js';

export class TabManager {
    constructor() {
        this.tabGroups = new Map();
        this.tabColors = new Map();
        this.observers = new Set();
        this.settings = SettingsService.getInstance();
        this.logger = Logger.getInstance();
        this.domainTabs = new Map();
    }

    addObserver(observer) {
        this.observers.add(observer);
        this.logger.debug('Observer added', { observerCount: this.observers.size });
    }

    removeObserver(observer) {
        this.observers.delete(observer);
        this.logger.debug('Observer removed', { observerCount: this.observers.size });
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => observer.update(event, data));
        this.logger.debug('Observers notified', { event, data });
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.hostname.split('.');
            const baseDomain = parts.slice(-2).join('.');
            const result = {
                full: urlObj.hostname,
                base: baseDomain,
                isSubdomain: parts.length > 2
            };
            this.logger.debug('Domain extracted', { url, domain: result });
            return result;
        } catch (error) {
            this.logger.error('Failed to extract domain', { url, error: error.message });
            return null;
        }
    }

    createGroupName(domainInfo) {
        const baseName = domainInfo.full.split('.')[0];
        const groupName = baseName === 'www' 
            ? domainInfo.base.split('.')[0].charAt(0).toUpperCase() + domainInfo.base.split('.')[0].slice(1)
            : baseName.charAt(0).toUpperCase() + baseName.slice(1);
        
        this.logger.debug('Group name created', { domainInfo, groupName });
        return groupName;
    }

    setTabColor(domain, color) {
        this.tabColors.set(domain, color);
        this.logger.info('Tab color set', { domain, color });
        this.notifyObservers('colorUpdated', { domain, color });
    }

    async updateDomainTabs(tab) {
        const domainInfo = this.extractDomain(tab.url);
        if (!domainInfo) {
            this.logger.warn('Could not update domain tabs - invalid domain', { tabId: tab.id, url: tab.url });
            return null;
        }

        if (!this.domainTabs.has(domainInfo.base)) {
            this.domainTabs.set(domainInfo.base, new Set());
            this.logger.debug('New domain tab group created', { domain: domainInfo.base });
        }
        this.domainTabs.get(domainInfo.base).add(tab.id);
        this.logger.debug('Domain tabs updated', { 
            domain: domainInfo.base, 
            tabCount: this.domainTabs.get(domainInfo.base).size 
        });

        return domainInfo;
    }

    async handleTab(tab) {
        if (!this.settings.isEnabled()) {
            this.logger.debug('Tab handling skipped - extension disabled');
            return;
        }
        
        if (!tab.url || tab.url.startsWith('chrome://')) {
            this.logger.debug('Tab handling skipped - invalid or chrome URL', { tabId: tab.id, url: tab.url });
            return;
        }

        const domainInfo = await this.updateDomainTabs(tab);
        if (!domainInfo) return;

        const tabsInDomain = this.domainTabs.get(domainInfo.base).size;
        const existingGroup = Array.from(this.tabGroups.entries())
            .find(([_, groupDomain]) => groupDomain === domainInfo.base);

        try {
            if (existingGroup) {
                const [groupId] = existingGroup;
                await chrome.tabs.group({
                    groupId: groupId,
                    tabIds: tab.id
                });
                this.logger.info('Tab added to existing group', { 
                    tabId: tab.id, 
                    groupId,
                    domain: domainInfo.base 
                });
                this.notifyObservers('tabGrouped', { tabId: tab.id, groupId });
            } else if (tabsInDomain >= 2) {
                const color = this.tabColors.get(domainInfo.base) || 'grey';
                const tabIds = Array.from(this.domainTabs.get(domainInfo.base));
                const groupId = await chrome.tabs.group({ tabIds });
                
                const groupName = this.createGroupName(domainInfo);
                await chrome.tabGroups.update(groupId, {
                    title: groupName,
                    color: color
                });
                
                this.tabGroups.set(groupId, domainInfo.base);
                this.logger.info('New tab group created', { 
                    groupId, 
                    domain: domainInfo.base, 
                    color,
                    name: groupName,
                    tabCount: tabIds.length
                });
                this.notifyObservers('groupCreated', { groupId, domain: domainInfo.base, color });
            }
        } catch (error) {
            this.logger.error('Failed to handle tab', { 
                error: error.message,
                tabId: tab.id,
                domain: domainInfo.base,
                stack: error.stack
            });
            this.notifyObservers('error', { error, tabId: tab.id });
        }
    }

    removeGroup(groupId) {
        const domain = this.tabGroups.get(groupId);
        if (domain) {
            this.domainTabs.delete(domain);
            this.logger.info('Domain tabs cleared', { domain, groupId });
        }
        this.tabGroups.delete(groupId);
        this.logger.info('Tab group removed', { groupId, domain });
        this.notifyObservers('groupRemoved', { groupId });
    }

    async cleanup() {
        const groupCount = this.tabGroups.size;
        this.logger.info('Starting cleanup', { groupCount });
        
        for (const [groupId] of this.tabGroups) {
            try {
                await chrome.tabGroups.ungroup(groupId);
                this.logger.debug('Group ungrouped during cleanup', { groupId });
            } catch (error) {
                this.logger.error('Failed to ungroup tabs during cleanup', { 
                    groupId,
                    error: error.message,
                    stack: error.stack
                });
            }
        }
        
        this.tabGroups.clear();
        this.domainTabs.clear();
        this.logger.info('Cleanup completed', { 
            clearedGroups: groupCount,
            remainingGroups: this.tabGroups.size,
            remainingDomains: this.domainTabs.size
        });
    }
} 