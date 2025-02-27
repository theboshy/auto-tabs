import { SettingsService } from './SettingsService.js';

export class TabManager {
    constructor() {
        this.tabGroups = new Map();
        this.tabColors = new Map();
        this.observers = new Set();
        this.settings = SettingsService.getInstance();
        this.domainTabs = new Map();
    }

    addObserver(observer) {
        this.observers.add(observer);
    }

    removeObserver(observer) {
        this.observers.delete(observer);
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => observer.update(event, data));
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.hostname.split('.');
            const baseDomain = parts.slice(-2).join('.');
            return {
                full: urlObj.hostname,
                base: baseDomain,
                isSubdomain: parts.length > 2
            };
        } catch (e) {
            console.error('Error extracting domain:', e);
            return null;
        }
    }

    createGroupName(domainInfo) {
        const baseName = domainInfo.full.split('.')[0];
        return baseName === 'www' 
            ? domainInfo.base.split('.')[0].charAt(0).toUpperCase() + domainInfo.base.split('.')[0].slice(1)
            : baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }

    setTabColor(domain, color) {
        this.tabColors.set(domain, color);
        this.notifyObservers('colorUpdated', { domain, color });
    }

    async updateDomainTabs(tab) {
        const domainInfo = this.extractDomain(tab.url);
        if (!domainInfo) return null;

        if (!this.domainTabs.has(domainInfo.base)) {
            this.domainTabs.set(domainInfo.base, new Set());
        }
        this.domainTabs.get(domainInfo.base).add(tab.id);

        return domainInfo;
    }

    async handleTab(tab) {
        if (!this.settings.isEnabled() || !tab.url || tab.url.startsWith('chrome://')) return;

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
                this.notifyObservers('tabGrouped', { tabId: tab.id, groupId });
            } else if (tabsInDomain >= 2) {
                const color = this.tabColors.get(domainInfo.base) || 'grey';
                const tabIds = Array.from(this.domainTabs.get(domainInfo.base));
                const groupId = await chrome.tabs.group({ tabIds });
                await chrome.tabGroups.update(groupId, {
                    title: this.createGroupName(domainInfo),
                    color: color
                });
                this.tabGroups.set(groupId, domainInfo.base);
                this.notifyObservers('groupCreated', { groupId, domain: domainInfo.base, color });
            }
        } catch (error) {
            console.error('Error handling tab:', error);
            this.notifyObservers('error', { error, tabId: tab.id });
        }
    }

    removeGroup(groupId) {
        const domain = this.tabGroups.get(groupId);
        if (domain) {
            this.domainTabs.delete(domain);
        }
        this.tabGroups.delete(groupId);
        this.notifyObservers('groupRemoved', { groupId });
    }

    async cleanup() {
        for (const [groupId] of this.tabGroups) {
            try {
                await chrome.tabGroups.ungroup(groupId);
            } catch (error) {
                console.error('Error ungrouping tabs:', error);
            }
        }
        this.tabGroups.clear();
        this.domainTabs.clear();
    }
} 