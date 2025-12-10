// Import our utility functions
import { isString, isArray, isObject, NODE_TYPES, generateId } from '../types.js';

// Create Virtual DOM Elements - This replaces direct DOM manipulation!
export function createElement(tag, attrs = {}, children = []) {
    // Normalize children - can be string, array, or single element
    const normalizedChildren = normalizeChildren(children);
    
    return {
        type: NODE_TYPES.ELEMENT,
        tag: tag,
        attrs: attrs || {},
        children: normalizedChildren,
        id: generateId('vdom') // Unique ID for tracking
    };
}

// Create text nodes (for plain text content)
export function createTextNode(text) {
    return {
        type: NODE_TYPES.TEXT,
        text: String(text),
        id: generateId('text')
    };
}

// Normalize children into consistent format
function normalizeChildren(children) {
    if (children === null || children === undefined) return [];
    if (isString(children)) return [createTextNode(children)];
    if (!isArray(children)) return [children];
    
    return children.map(child => {
        if (isString(child)) return createTextNode(child);
        return child;
    });
}

// convert virtual DOM element to real DOM element 
export function createDOMElement(vNode) {
    if (!vNode) return null;

    // Handle text nodes
    if (vNode.type === NODE_TYPES.TEXT) {
        return document.createTextNode(vNode.text);
    }

    // Handle element nodes
    if (vNode.type === NODE_TYPES.ELEMENT){
        const element = document.createElement(vNode.tag);

        //set attributes
        setAttributes(element, vNode.attrs);

        // Add children recursively
        vNode.children.forEach(child => {
            const childElement = createDOMElement(child);
            if (childElement) {
                element.appendChild(childElement);
            }
        });
        return element;
    }
    return null ;
}

// Set attributes on DOM element
function setAttributes(element, attrs) {
    Object.keys(attrs).forEach(key => {
        const value = attrs[key];
        
        // Handle special attributes
        if (key === 'className' || key === 'class') {
            element.className = value;
        } else if (key === 'htmlFor') {
            element.htmlFor = value;
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else if (typeof value === 'boolean') {
            if (value) {
                element.setAttribute(key, '');
            }
        } else {
            element.setAttribute(key, value);
        }
    });
}

// Main render function - renders virtual DOM to real DOM container
export function render(vNode, container) {
    // Clear container and render fresh
    container.innerHTML = '' ;
    const domElement = createDOMElement(vNode);
    if (domElement){
        container.appendChild(domElement);
    }
}

// Advance render with diffing - only updates what changed 
export function renderWithDiff(newVNode, oldVNode, container){
    if (!oldVNode){
        // First render - no diffing needed
        return render(newVNode, container);
    }

    // Diff and patch the changes 
    const patches = diff(oldVNode, newVNode);
    patch(container.firstChild, patches);
}

// Compare two virtual DOM trees and find differences
function diff(oldVNode, newVNode) {
    const patches = [];
    
    // If nodes are completely different, replace
    if (!oldVNode || !newVNode || oldVNode.type !== newVNode.type || oldVNode.tag !== newVNode.tag) {
        patches.push({
            type: 'REPLACE',
            newNode: newVNode
        });
        return patches;
    }
    
    // Check text content
    if (oldVNode.type === NODE_TYPES.TEXT && newVNode.type === NODE_TYPES.TEXT) {
        if (oldVNode.text !== newVNode.text) {
            patches.push({
                type: 'TEXT_CHANGE',
                text: newVNode.text
            });
        }
        return patches;
    }
    
    // Check attributes
    const attrPatches = diffAttributes(oldVNode.attrs, newVNode.attrs);
    if (attrPatches.length > 0) {
        patches.push({
            type: 'ATTRS',
            attrs: attrPatches
        });
    }
    
    // Check children
    const childPatches = diffChildren(oldVNode.children, newVNode.children);
    if (childPatches.length > 0) {
        patches.push({
            type: 'CHILDREN',
            patches: childPatches
        });
    }
    
    return patches;
}

// Compare attributes between old and new virtual nodes
function diffAttributes(oldAttrs, newAttrs) {
    const patches = [];
    
    // Check for removed or changed attributes
    Object.keys(oldAttrs).forEach(key => {
        if (!(key in newAttrs)) {
            patches.push({ type: 'REMOVE_ATTR', key });
        } else if (oldAttrs[key] !== newAttrs[key]) {
            patches.push({ type: 'SET_ATTR', key, value: newAttrs[key] });
        }
    });
    
    // Check for new attributes
    Object.keys(newAttrs).forEach(key => {
        if (!(key in oldAttrs)) {
            patches.push({ type: 'SET_ATTR', key, value: newAttrs[key] });
        }
    });
    
    return patches;
}

// Compare children arrays
function diffChildren(oldChildren, newChildren) {
    const patches = [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);
    
    for (let i = 0; i < maxLength; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];
        
        if (!oldChild && newChild) {
            // New child added
            patches.push({ type: 'ADD_CHILD', index: i, node: newChild });
        } else if (oldChild && !newChild) {
            // Child removed
            patches.push({ type: 'REMOVE_CHILD', index: i });
        } else if (oldChild && newChild) {
            // Child might have changed
            const childPatches = diff(oldChild, newChild);
            if (childPatches.length > 0) {
                patches.push({ type: 'PATCH_CHILD', index: i, patches: childPatches });
            }
        }
    }
    
    return patches;
}

// Apply patches to real DOM element
function patch(domNode, patches) {
    patches.forEach(patch => {
        switch (patch.type) {
            case 'REPLACE':
                const newElement = createDOMElement(patch.newNode);
                if (domNode.parentNode && newElement) {
                    domNode.parentNode.replaceChild(newElement, domNode);
                }
                break;
                
            case 'TEXT_CHANGE':
                domNode.textContent = patch.text;
                break;
                
            case 'ATTRS':
                applyAttributePatches(domNode, patch.attrs);
                break;
                
            case 'CHILDREN':
                applyChildPatches(domNode, patch.patches);
                break;
        }
    });
}

// Apply attribute patches to DOM element
function applyAttributePatches(domNode, attrPatches) {
    attrPatches.forEach(attrPatch => {
        switch (attrPatch.type) {
            case 'SET_ATTR':
                if (attrPatch.key === 'className' || attrPatch.key === 'class') {
                    domNode.className = attrPatch.value;
                } else {
                    domNode.setAttribute(attrPatch.key, attrPatch.value);
                }
                break;
                
            case 'REMOVE_ATTR':
                domNode.removeAttribute(attrPatch.key);
                break;
        }
    });
}

// Apply child patches to DOM element
function applyChildPatches(domNode, childPatches) {
    childPatches.forEach(childPatch => {
        switch (childPatch.type) {
            case 'ADD_CHILD':
                const newChild = createDOMElement(childPatch.node);
                if (newChild) {
                    domNode.appendChild(newChild);
                }
                break;
                
            case 'REMOVE_CHILD':
                if (domNode.children[childPatch.index]) {
                    domNode.removeChild(domNode.children[childPatch.index]);
                }
                break;
                
            case 'PATCH_CHILD':
                if (domNode.children[childPatch.index]) {
                    patch(domNode.children[childPatch.index], childPatch.patches);
                }
                break;
        }
    });
}


// Component class for stateful components
export class Component {
    constructor(props = {}) {
        this.props = props;
        this.state = {};
        this.vNode = null;
        this.domNode = null;
    }
    
    // Override this method in your components
    render() {
        return createElement('div', {}, 'Override render method');
    }
    
    // Update component state and re-render
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.update();
    }
    
    // Re-render component with new state
    update() {
        const newVNode = this.render();
        if (this.vNode && this.domNode && this.domNode.parentNode) {
            const patches = diff(this.vNode, newVNode);
            patch(this.domNode, patches);
        }
        this.vNode = newVNode;
    }
    
    // Mount component to DOM
    mount(container) {
        this.vNode = this.render();
        this.domNode = createDOMElement(this.vNode);
        if (this.domNode) {
            container.appendChild(this.domNode);
        }
    }
}

// Create component element
export function createComponent(ComponentClass, props = {}) {
    return {
        type: NODE_TYPES.COMPONENT,
        ComponentClass,
        props,
        id: generateId('component')
    };
}

// App class to manage the entire application
export class App {
    constructor(rootComponent, container) {
        this.rootComponent = rootComponent;
        this.container = container;
        this.currentVTree = null;
        this.stateUnsubscribe = null;
    }
    
    // Connect to state store for automatic updates
    connectToStore(store) {
        this.stateUnsubscribe = store.subscribe((newState) => {
            this.render();
        });
    }
    
    // Render the entire app
    render() {
        const newVTree = this.rootComponent();
        
        if (!this.currentVTree) {
            // First render
            render(newVTree, this.container);
        } else {
            // Update render
            renderWithDiff(newVTree, this.currentVTree, this.container);
        }
        
        this.currentVTree = newVTree;
    }
    
    // Clean up when app is destroyed
    destroy() {
        if (this.stateUnsubscribe) {
            this.stateUnsubscribe();
        }
    }
}

// Helper function to create apps easily
export function createApp(rootComponent, container) {
    return new App(rootComponent, container);
}

// Utility functions for common HTML elements
export const h = {
    div: (attrs, children) => createElement('div', attrs, children),
    span: (attrs, children) => createElement('span', attrs, children),
    button: (attrs, children) => createElement('button', attrs, children),
    input: (attrs, children) => createElement('input', attrs, children),
    ul: (attrs, children) => createElement('ul', attrs, children),
    li: (attrs, children) => createElement('li', attrs, children),
    h1: (attrs, children) => createElement('h1', attrs, children),
    h2: (attrs, children) => createElement('h2', attrs, children),
    p: (attrs, children) => createElement('p', attrs, children),
    form: (attrs, children) => createElement('form', attrs, children),
    label: (attrs, children) => createElement('label', attrs, children)
};

