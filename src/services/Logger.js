export class Logger {
    static instance = null;
    
    constructor() {
        if (Logger.instance) {
            return Logger.instance;
        }
        this.logs = [];
        Logger.instance = this;
    }

    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        
        this.logs.push(logEntry);
        
        switch (level) {
            case 'error':
                console.error(message, data);
                break;
            case 'warn':
                console.warn(message, data);
                break;
            case 'info':
                console.info(message, data);
                break;
            default:
                console.log(message, data);
        }
    }

    error(message, data = {}) {
        this.log('error', message, data);
    }

    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    info(message, data = {}) {
        this.log('info', message, data);
    }

    debug(message, data = {}) {
        this.log('debug', message, data);
    }

    getLogs() {
        return [...this.logs];
    }
} 