export class Logger {
    static #instance = null;
    
    static getInstance() {
        if (!Logger.#instance) {
            Logger.#instance = new Logger();
        }
        return Logger.#instance;
    }

    constructor() {
        if (Logger.#instance) {
            return Logger.#instance;
        }
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        this.currentLevel = this.levels.debug;
        Logger.#instance = this;
    }

    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.currentLevel = this.levels[level];
        }
    }

    formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            message,
            ...data
        };
    }

    debug(message, data = {}) {
        if (this.currentLevel <= this.levels.debug) {
            console.debug(this.formatMessage('debug', message, data));
        }
    }

    info(message, data = {}) {
        if (this.currentLevel <= this.levels.info) {
            console.info(this.formatMessage('info', message, data));
        }
    }

    warn(message, data = {}) {
        if (this.currentLevel <= this.levels.warn) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message, data = {}) {
        if (this.currentLevel <= this.levels.error) {
            console.error(this.formatMessage('error', message, data));
        }
    }

    getLogs() {
        return [...this.logs];
    }
} 