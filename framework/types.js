//Type checking utilities - these help us verify what kind of data we're working with
export const isObject = (obj) => obj !== null && typeof obj === 'object' && !Array.isArray(obj); // Check if it's a plain object (not null, not array)
export const isArray = Array.isArray; // Built-in function to check for arrays
export const isFunction = (fn) => typeof fn === 'function'; // Check if something can be called as a function
export const isString = (str) => typeof str === 'string'; // Check if it's text data

//Object utilities - for working with objects safely
export const deepClone = (obj) => {
    // If it's not an object, just return it as-is (numbers, strings, booleans, null)
    if (obj === null || typeof obj !== 'object') return obj;
    // Special case for Date objects - create new Date with same time
    if (obj instanceof Date) return new Date(obj.getTime());
    // If it's an array, clone each item recursively
    if (Array.isArray(obj)) return obj.map(deepClone);

    const cloned = {}; // Create new empty object
    for (const key in obj){ // Loop through all properties
        if (obj.hasOwnProperty(key)){ // Make sure it's not inherited property
            cloned[key] = deepClone(obj[key]); // Recursively clone each property
        }
    }
    return cloned; // Return the completely new object
};

export const merge = (...objects) => { // Accept any number of objects to merge
    const result = {}; // Start with empty object
    objects.forEach(obj =>{ // Loop through each object passed in
        if (isObject(obj)){ // Make sure it's actually an object
            Object.keys(obj).forEach(key => { // Get all property names
                result[key] = obj[key]; // Copy each property to result
            });
        }
    });
    return result; // Return merged object
};

//Array utilities - for working with lists of data
export const unique = (arr) => [...new Set(arr)]; // Remove duplicates using Set data structure
export const findById = (arr, id) => arr.find(item => item.id === id); // Find first item with matching id
export const removeById = (arr, id) => arr.filter(item => item.id !== id); // Remove all items with matching id

//Unique ID generator - creates unique IDs for elements
let idCounter = 0; // Private counter that increments
export const generateId = (prefix = 'id') => `${prefix}_${++idCounter}`; // Create unique ID like "id_1", "todo_2"

// Framework constants - shared values across the framework
export const FRAMEWORK_EVENTS  = {
    STATE_CHANGED: 'framework:state-changed', // When app state updates
    ROUTE_CHANGED: 'framework:route-changed', // When URL/route changes
    COMPONENT_MOUNTED: 'framework:component-mounted' // When component is added to DOM
};

export const NODE_TYPES = { // Different types of virtual DOM nodes
    ELEMENT: 'element', // HTML elements like div, button
    TEXT: 'text', // Plain text content
    COMPONENT: 'component' // Framework components
};