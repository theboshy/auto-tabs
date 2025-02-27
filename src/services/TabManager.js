export class TabManager {
    constructor() {
        this.tabGroups = new Map();
        this.tabColors = new Map();
        this.observers = new Set();
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
            if (parts.length > 2 && parts[0] !== 'www') {
                return parts.slice(-2).join('.');
            }
            return parts.slice(-2).join('.').replace('www.', '');
        } catch (e) {
            console.error('Error extracting domain:', e);
            return null;
        }
    }

    createGroupName(domain) {
        return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    }

    setTabColor(domain, color) {
        this.tabColors.set(domain, color);
        this.notifyObservers('colorUpdated', { domain, color });
    }

    async handleTab(tab) {
        if (!tab.url || tab.url.startsWith('chrome://')) return;

        const domain = this.extractDomain(tab.url);
        if (!domain) return;

        const existingGroup = Array.from(this.tabGroups.entries())
            .find(([_, groupDomain]) => groupDomain === domain);

        try {
            if (existingGroup) {
                const [groupId] = existingGroup;
                await chrome.tabs.group({
                    groupId: groupId,
                    tabIds: tab.id
                });
                this.notifyObservers('tabGrouped', { tabId: tab.id, groupId });
            } else {
                const color = this.tabColors.get(domain) || 'grey';
                const groupId = await chrome.tabs.group({
                    tabIds: tab.id
                });
                await chrome.tabGroups.update(groupId, {
                    title: this.createGroupName(domain),
                    color: color
                });
                this.tabGroups.set(groupId, domain);
                this.notifyObservers('groupCreated', { groupId, domain, color });
            }
        } catch (error) {
            console.error('Error handling tab:', error);
            this.notifyObservers('error', { error, tabId: tab.id });
        }
    }

    removeGroup(groupId) {
        this.tabGroups.delete(groupId);
        this.notifyObservers('groupRemoved', { groupId });
    }
} 