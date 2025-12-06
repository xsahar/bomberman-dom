// Import helper functions from our types file
import { deepClone, isFunction, FRAMEWORK_EVENTS } from '../types.js';

// The main state store - this holds ALL app data
class StateStore {
    constructor(initialState = {}) {
        this.state = initialState; // Current app data (todos, user info, etc.)
        this.subscribers = []; // List of functions that want to know when state changes
    }

    // Subscribe - let components listen for state changes
    subscribe(callback) {
        if (!isFunction(callback)) {
            throw new Error('callback must be a function');
        }
        this.subscribers.push(callback); // Add callback to list of listeners
        
        // Return unsubscribe function
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1); // remove from list 
            }
        };
    }

    // notify all subscribers that state changed
    notify() {
        this.subscribers.forEach(callback => {
            callback(this.state);
        });
    }
    //setState - safely update the state 
    setState(newState){
        //create a completely new state object (immutability)
        this.state = deepClone({...this.state, ...newState});

        // tell all subscribers about the change
        this.notify();

        // Emit framework event for the debugging/logging 
        if(typeof window !== 'undefined'){
            window.dispatchEvent(new CustomEvent(FRAMEWORK_EVENTS.STATE_CHANGED, {
                detail: { newState: this.state}
            }));
        }
    }

    //getState - get current state (read-only copy)
    getState(){
        return deepClone(this.state); //Return copy to prevent direct mutation
    }

}


// Create the global store instance that the whole app will use
// In framework/core/state.js, update the initial state:

const store = new StateStore({
  todos: [],
  filter: 'all',
  editingId: null,
  
  // Add map state
  map: {
    data: [],      // The actual map grid
    rows: 13,
    cols: 15
  },
  
  // Add player state
  players: []
});

// Export the store and StateStore class
export { store, StateStore };
export default store; // Default export for easy importing

