import { Logger } from './Logger.js';
import { CHROME_COLORS } from '../constants/colors.js';

export class TabColorService {
    static #instance = null;
    
    static getInstance() {
        if (!TabColorService.#instance) {
            TabColorService.#instance = new TabColorService();
        }
        return TabColorService.#instance;
    }

    constructor() {
        if (TabColorService.#instance) {
            return TabColorService.#instance;
        }
        this.logger = Logger.getInstance();
        TabColorService.#instance = this;
    }

    getClosestChromeColor(rgb) {
        let closestColor = 'grey';
        let minDistance = Infinity;

        for (const [colorName, colorValue] of Object.entries(CHROME_COLORS)) {
            const distance = this.calculateDistance(rgb, colorValue);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = colorName;
            }
        }

        this.logger.debug('Mapped RGB to closest Chrome color', { rgb, closestColor });
        return closestColor;
    }

    calculateDistance(rgb1, rgb2) {
        return Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) +
            Math.pow(rgb1.g - rgb2.g, 2) +
            Math.pow(rgb1.b - rgb2.b, 2)
        );
    }
} 