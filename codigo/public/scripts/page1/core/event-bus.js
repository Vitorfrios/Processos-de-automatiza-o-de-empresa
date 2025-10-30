// event-bus.js
// sistema de eventos (pub/sub) entre módulos

class EventBus {
    constructor() {
        this.listeners = {};
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no listener do evento ${event}:`, error);
                }
            });
        }
    }
}

export const eventBus = new EventBus();

export function initializeEventBus() {
    window.eventBus = eventBus;
    console.log('📡 Event Bus inicializado');
}
