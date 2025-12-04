// Import utilities
import { isFunction, FRAMEWORK_EVENTS } from "../types.js";

// Router class - handle URL routing and navigation
class Router{
    constructor(){
        this.routes = new Map(); // Store route patterns and handlers
        this.currentRoute = null; // Current active route 
        this.currentParams = {}; // Parameters from current route 
        this.beforeRouteChange = null; // Hook for before route changes
        this.afterRouteChange = null; // Hook for after route changes

        //Listen for browser navigation (back/forward buttons)
        window.addEventListener('popstate', (event) => {
            this.handleRouteChange(window.location.pathname);
        });
    }

    // Rigister a route with pattern and handler
    route(pattern, handler) {
        if (!isFunction(handler)) {
            throw new Error('Route handler must be a function');
        }

        this.routes.set(pattern, {
            pattern,
            handler,
            regex: this.patternToRegex(pattern)
        });
        return this; // Allow chaining
    }

    //convert route pattern to regex for matching
    patternToRegex(pattern){
        //convert /users/:id to /users/([^/]+)
        const regexPattern = pattern
        .replace(/\//g, '\\/') //Escape forward slashes
        .replace(/:([^/]+)/g, '([^/]+)'); //convert :param to capture group

        return new RegExp('^' + regexPattern + '$');
    }

    
    // Find matching route for given path
    findRoute(path) {
        for (const [pattern, routeInfo] of this.routes) {
            const match = path.match(routeInfo.regex);
            if (match) {
                // Extract parameters from URL
                const params = this.extractParams(pattern, match);
                return { routeInfo, params };
            }
        }
        return null; // No matching route
    }
    
    // Extract parameters from URL match
    extractParams(pattern, match) {
        const params = {};
        const paramNames = pattern.match(/:([^/]+)/g) || [];
        
        paramNames.forEach((param, index) => {
            const paramName = param.substring(1); // Remove ':'
            params[paramName] = match[index + 1]; // Get captured group
        });
        
        return params;
    }
    
    // Navigate to a new route programmatically
    navigate(path, pushState = true) {
        if (pushState) {
            // Add to browser history
            window.history.pushState({}, '', path);
        }
        
        this.handleRouteChange(path);
    }
    
    // Handle route change (internal method)
    handleRouteChange(path) {
        const match = this.findRoute(path);
        
        // Call before route change hook
        if (this.beforeRouteChange) {
            this.beforeRouteChange(this.currentRoute, path);
        }
        
        if (match) {
            this.currentRoute = path;
            this.currentParams = match.params;
            
            // Call the route handler
            match.routeInfo.handler(match.params, path);
            
            // Emit framework event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(FRAMEWORK_EVENTS.ROUTE_CHANGED, {
                    detail: { path, params: match.params }
                }));
            }
        } else {
            // No matching route - could handle 404 here
            console.warn(`No route found for path: ${path}`);
        }
        
        // Call after route change hook
        if (this.afterRouteChange) {
            this.afterRouteChange(path, match?.params);
        }
    }


    // Initialize router and start listening
    start() {
        // Handle initial page load
        this.handleRouteChange(window.location.pathname);
    }
    
    // Add hooks for route changes
    beforeEach(callback) {
        this.beforeRouteChange = callback;
        return this;
    }
    
    afterEach(callback) {
        this.afterRouteChange = callback;
        return this;
    }
    
    // Get current route info
    getCurrentRoute() {
        return {
            path: this.currentRoute,
            params: this.currentParams
        };
    }
    
    // Check if current path matches pattern
    isActive(pattern) {
        if (!this.currentRoute) return false;
        const routeInfo = this.routes.get(pattern);
        if (!routeInfo) return false;
        
        return !!this.currentRoute.match(routeInfo.regex);
    }
}

// Create global router instance
const router = new Router();

// Export convenient methods for users
export const route = (pattern, handler) => router.route(pattern, handler);
export const navigate = (path, pushState = true) => router.navigate(path, pushState);
export const start = () => router.start();
export const beforeEach = (callback) => router.beforeEach(callback);
export const afterEach = (callback) => router.afterEach(callback);
export const getCurrentRoute = () => router.getCurrentRoute();
export const isActive = (pattern) => router.isActive(pattern);

// Export router class and instance
export { Router, router };
export default router;