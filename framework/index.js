// Import all framework modules
import store, { StateStore } from './core/state.js';
import eventManager, { EventManager, on, off, onClick, onInput, onChange, onKeydown, onSubmit } from './core/events.js';
import router, { Router, route, navigate, start, beforeEach, afterEach, getCurrentRoute, isActive } from './core/router.js';
import { 
    createElement, 
    createTextNode, 
    render, 
    renderWithDiff, 
    createDOMElement,
    Component, 
    createComponent, 
    App, 
    createApp, 
    h 
} from './core/dom.js';
import { 
    isObject, 
    isArray, 
    isFunction, 
    isString, 
    deepClone, 
    merge, 
    unique, 
    findById, 
    removeById, 
    generateId,
    FRAMEWORK_EVENTS,
    NODE_TYPES
} from './types.js';

// Re-export everything for easy importing
export {
    // State Management
    store, StateStore,
    
    // Event System  
    eventManager, EventManager, on, off, onClick, onInput, onChange, onKeydown, onSubmit,
    
    // Routing System
    router, Router, route, navigate, start, beforeEach, afterEach, getCurrentRoute, isActive,
    
    // DOM System
    createElement, createTextNode, render, renderWithDiff, createDOMElement,
    Component, createComponent, App, createApp, h,
    
    // Utilities
    isObject, isArray, isFunction, isString, deepClone, merge, unique, 
    findById, removeById, generateId, FRAMEWORK_EVENTS, NODE_TYPES
};

// Default export for convenience
export default {
    // Core instances
    store, eventManager, router,
    
    // Main functions users need
    createElement, render, on, navigate, route,
    
    // Helper shortcuts
    h, Component, createApp
};