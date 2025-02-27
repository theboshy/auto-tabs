import { ColorService } from './services/ColorService.js';
import { Logger } from './services/Logger.js';

class ContentScript {
    constructor() {
        this.colorService = ColorService.getInstance();
        this.logger = Logger.getInstance();
    }

    async init() {
        try {
            const color = await this.colorService.getPrimaryColor();
            chrome.runtime.sendMessage({
                type: 'primaryColor',
                color: color,
                url: window.location.href
            });
            this.logger.info('Primary color extracted and sent', { color });
        } catch (error) {
            this.logger.error('Error in content script initialization', { error });
        }
    }
}

const contentScript = new ContentScript();
contentScript.init(); 