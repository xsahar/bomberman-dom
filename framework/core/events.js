//Import helper functions
import { isFunction } from "../types.js";

//Event Manager - handles all events in our framework
class EventManager{
    constructor(){
        this.listeners = new Map(); //store all the event listeners
        this.delegatedListeners = new Map(); // store delegated listeners
        this.setupDelegation(); // set up global event delegation
    }
   
    // set up global event delegatioin - one listener to rule them all!
    setupDelegation(){
        // Common events we want to handle 
        const events = ['click', 'input', 'change', 'keydown', 'keyup', 'submit'];

        events.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.handleDelegatedEvent(eventType, event);
            }, true); // true = capture phase for better performance
        });
    }

    handleDelegatedEvent(eventType, originalEvent) {
        const target = originalEvent.target;

        //check if we have any listeners for this event type
        const listenersForType = this.delegatedListeners.get(eventType);
        if (!listenersForType) return;

        //check each selector to see if the target matches
        listenersForType.forEach((callback, selector) =>{
            if (target.matches(selector) || target.closest(selector)){
                // create enhanced event object 
                const enhancedEvent = this.createEnhancedEvent(originalEvent);
                callback(enhancedEvent);
            }
        });
    }

    // Create enhanced event object with framework features
    createEnhancedEvent(originalEvent) {
        // Create enhanced event that properly delegates to original
        const enhanced = {
            // Core event properties
            target: originalEvent.target,
            currentTarget: originalEvent.currentTarget,
            type: originalEvent.type,
            key: originalEvent.key,
            keyCode: originalEvent.keyCode,
            which: originalEvent.which,
            code: originalEvent.code,
            ctrlKey: originalEvent.ctrlKey,
            shiftKey: originalEvent.shiftKey,
            altKey: originalEvent.altKey,
            metaKey: originalEvent.metaKey,
            
            // Enhanced framework features
            preventDefault() {
                originalEvent.preventDefault();
                return false;
            },
            
            stopPropagation() {
                originalEvent.stopPropagation();
            },
            
            // Get data attributes easily
            getData(key) {
                return originalEvent.target.dataset[key];
            },
            
            // Get closest parent with selector
            closest(selector) {
                return originalEvent.target.closest(selector);
            },
            
            // Framework-specific data
            framework: 'mini-framework',
            timestamp: Date.now()
        };
        
        return enhanced;
    }

    // PUBLIC API - User-friendly methods (replaces addEventListener!)
    
    // Main event method - on('click', '.button', handler)
    on(eventType, selector, callback) {
        if (!isFunction(callback)) {
            throw new Error('Callback must be a function');
        }
        
        // Store in delegated listeners
        if (!this.delegatedListeners.has(eventType)) {
            this.delegatedListeners.set(eventType, new Map());
        }
        
        this.delegatedListeners.get(eventType).set(selector, callback);
        
        // Return unsubscribe function
        return () => this.off(eventType, selector);
    }

    // Remove event listener
    off(eventType, selector) {
        if (this.delegatedListeners.has(eventType)) {
            this.delegatedListeners.get(eventType).delete(selector);
        }
    }
}


// Create global event manager instance
const eventManager = new EventManager();

// Export convenient shorthand methods for users
export const on = (eventType, selector, callback) => eventManager.on(eventType, selector, callback);
export const off = (eventType, selector) => eventManager.off(eventType, selector);

// Shorthand methods for common events
export const onClick = (selector, callback) => on('click', selector, callback);
export const onInput = (selector, callback) => on('input', selector, callback);
export const onChange = (selector, callback) => on('change', selector, callback);
export const onKeydown = (selector, callback) => on('keydown', selector, callback);
export const onSubmit = (selector, callback) => on('submit', selector, callback);

// Export the event manager class and instance
export { EventManager, eventManager };
export default eventManager;

