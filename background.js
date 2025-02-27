// Store tab colors and groups
let tabGroups = new Map();
let tabColors = new Map();

// Function to extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        const parts = urlObj.hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www') {
            return parts.slice(-2).join('.');
        }
        return parts.slice(-2).join('.').replace('www.', '');
    } catch (e) {
        return null;
    }
}

// Function to create a human-readable name from domain
function createGroupName(domain) {
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

// Function to convert color string to RGB object
function parseColor(color) {
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return { r, g, b };
    } else if (color.startsWith('rgb')) {
        const [r, g, b] = color.match(/\d+/g).map(Number);
        return { r, g, b };
    }
    return null;
}

// Function to find the closest Chrome color
function findClosestChromeColor(color) {
    const chromeColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
    const colorValues = {
        'grey': { r: 128, g: 128, b: 128 },
        'blue': { r: 0, g: 0, b: 255 },
        'red': { r: 255, g: 0, b: 0 },
        'yellow': { r: 255, g: 255, b: 0 },
        'green': { r: 0, g: 255, b: 0 },
        'pink': { r: 255, g: 192, b: 203 },
        'purple': { r: 128, g: 0, b: 128 },
        'cyan': { r: 0, g: 255, b: 255 }
    };

    const rgb = parseColor(color);
    if (!rgb) return 'grey';

    let minDistance = Infinity;
    let closestColor = 'grey';

    for (const [name, value] of Object.entries(colorValues)) {
        const distance = Math.sqrt(
            Math.pow(rgb.r - value.r, 2) +
            Math.pow(rgb.g - value.g, 2) +
            Math.pow(rgb.b - value.b, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = name;
        }
    }

    return closestColor;
}

// Handle new tabs and group them
async function handleTab(tab) {
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    const domain = extractDomain(tab.url);
    if (!domain) return;

    const existingGroup = Array.from(tabGroups.entries())
        .find(([_, groupDomain]) => groupDomain === domain);

    if (existingGroup) {
        // Add to existing group
        const [groupId] = existingGroup;
        await chrome.tabs.group({
            groupId: groupId,
            tabIds: tab.id
        });
    } else {
        // Create new group
        const color = tabColors.get(domain) || 'grey';
        const groupId = await chrome.tabs.group({
            tabIds: tab.id
        });
        await chrome.tabGroups.update(groupId, {
            title: createGroupName(domain),
            color: findClosestChromeColor(color)
        });
        tabGroups.set(groupId, domain);
    }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        handleTab(tab);
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'primaryColor' && sender.tab) {
        const domain = extractDomain(message.url);
        if (domain) {
            tabColors.set(domain, message.color);
        }
    }
});

// Clean up when groups are removed
chrome.tabGroups.onRemoved.addListener((group) => {
    tabGroups.delete(group.id);
}); 