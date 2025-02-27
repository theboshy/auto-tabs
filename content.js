function getImageColor(imgElement) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const width = imgElement.width || imgElement.naturalWidth;
    const height = imgElement.height || imgElement.naturalHeight;
    
    canvas.width = width;
    canvas.height = height;
    context.drawImage(imgElement, 0, 0);
    
    const data = context.getImageData(0, 0, width, height).data;
    let r = 0, g = 0, b = 0, count = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }
    
    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
    };
}

function getMetaThemeColor() {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        return metaThemeColor.getAttribute('content');
    }
    return null;
}

function getFaviconColor() {
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon) {
        const img = new Image();
        img.src = favicon.href;
        return new Promise((resolve) => {
            img.onload = () => {
                resolve(getImageColor(img));
            };
            img.onerror = () => {
                resolve(null);
            };
        });
    }
    return Promise.resolve(null);
}

async function getPrimaryColor() {
    const metaColor = getMetaThemeColor();
    if (metaColor) {
        return metaColor;
    }

    const faviconColor = await getFaviconColor();
    if (faviconColor) {
        return `rgb(${faviconColor.r}, ${faviconColor.g}, ${faviconColor.b})`;
    }

    return '#666666';
}

getPrimaryColor().then(color => {
    chrome.runtime.sendMessage({
        type: 'primaryColor',
        color: color,
        url: window.location.href
    });
}); 