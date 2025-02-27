import { CHROME_COLORS, DEFAULT_COLOR } from '../constants/colors.js';

class MetaColorStrategy {
    extract() {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        return metaThemeColor ? metaThemeColor.getAttribute('content') : null;
    }
}

class FaviconColorStrategy {
    static getImageColor(imgElement) {
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

    async extract() {
        const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (!favicon) return null;

        try {
            const img = new Image();
            img.src = favicon.href;
            return new Promise((resolve) => {
                img.onload = () => {
                    const color = FaviconColorStrategy.getImageColor(img);
                    resolve(`rgb(${color.r}, ${color.g}, ${color.b})`);
                };
                img.onerror = () => resolve(null);
            });
        } catch (error) {
            console.error('Error extracting favicon color:', error);
            return null;
        }
    }
}

export class ColorService {
    static instance = null;
    
    constructor() {
        if (ColorService.instance) {
            return ColorService.instance;
        }
        this.strategies = [
            new MetaColorStrategy(),
            new FaviconColorStrategy()
        ];
        ColorService.instance = this;
    }

    static getInstance() {
        if (!ColorService.instance) {
            ColorService.instance = new ColorService();
        }
        return ColorService.instance;
    }

    parseColor(color) {
        if (!color) return null;
        
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

    findClosestChromeColor(color) {
        const rgb = this.parseColor(color);
        if (!rgb) return 'grey';

        let minDistance = Infinity;
        let closestColor = 'grey';

        Object.entries(CHROME_COLORS).forEach(([name, value]) => {
            const distance = Math.sqrt(
                Math.pow(rgb.r - value.r, 2) +
                Math.pow(rgb.g - value.g, 2) +
                Math.pow(rgb.b - value.b, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = name;
            }
        });

        return closestColor;
    }

    async getPrimaryColor() {
        for (const strategy of this.strategies) {
            const color = await strategy.extract();
            if (color) return color;
        }
        return DEFAULT_COLOR;
    }
} 