# Nested Loops Explanation - Map Generator

## What Are Nested Loops?

Nested loops are loops inside other loops. They're used when you need to work with **2D data structures** like grids, matrices, or tables.

In Bomberman, the map is a **2D grid** (13 rows × 15 columns), so we need nested loops to access every cell.

---

## How It Works

Think of it like reading a book:
- **Outer loop** = Going through each line (row by row)
- **Inner loop** = Reading each word on that line (column by column)

```javascript
for (let row = 0; row < 13; row++) {        // Outer loop: rows
    for (let col = 0; col < 15; col++) {    // Inner loop: columns
        // Do something with position [row][col]
    }
}
```

**Execution order:**
```
[0,0] → [0,1] → [0,2] → ... → [0,14]    (finish row 0)
[1,0] → [1,1] → [1,2] → ... → [1,14]    (finish row 1)
[2,0] → [2,1] → [2,2] → ... → [2,14]    (finish row 2)
...
[12,0] → [12,1] → [12,2] → ... → [12,14] (finish row 12)
```

**Total iterations:** 13 rows × 15 columns = **195 iterations**

---

## Example 1: Creating an Empty Map

**Location:** `mapGenerator.js` - `createEmptyMap()` method

**Purpose:** Build a blank 13×15 grid filled with empty cells

```javascript
createEmptyMap() {
    this.map = [];  // Start with empty array
    
    // OUTER LOOP: Go through each ROW (0 to 12)
    for (let row = 0; row < this.rows; row++) {
        const rowArr = [];  // Create a new empty row
        
        // INNER LOOP: Go through each COLUMN in this row (0 to 14)
        for (let col = 0; col < this.cols; col++) {
            rowArr.push({ type: 'empty' });  // Add one empty cell
        }
        
        this.map.push(rowArr);  // Add the completed row to the map
    }
}
```

**What happens step by step:**
```
Row 0: Create array with 15 empty cells → [empty, empty, empty, ...]
Row 1: Create array with 15 empty cells → [empty, empty, empty, ...]
Row 2: Create array with 15 empty cells → [empty, empty, empty, ...]
...
Row 12: Create array with 15 empty cells → [empty, empty, empty, ...]

Final result: A 2D array with 13 rows × 15 columns = 195 cells
```

**Visual representation:**
```
[
  [empty, empty, empty, empty, empty, ...],  ← Row 0
  [empty, empty, empty, empty, empty, ...],  ← Row 1
  [empty, empty, empty, empty, empty, ...],  ← Row 2
  ...
  [empty, empty, empty, empty, empty, ...]   ← Row 12
]
```

---

## Example 2: Placing Walls

**Location:** `mapGenerator.js` - `placeWalls()` method

**Purpose:** Add border walls and create a checkerboard pattern of inner walls

```javascript
placeWalls() {
    // OUTER LOOP: Visit each row
    for (let row = 0; row < this.rows; row++) {
        
        // INNER LOOP: Visit each column in this row
        for (let col = 0; col < this.cols; col++) {
            
            // CHECK 1: Is this cell on the edge? (Border Wall)
            const isBorder = row === 0 || col === 0 || 
                           row === this.rows - 1 || col === this.cols - 1;
            
            if (isBorder) {
                this.map[row][col].type = 'wall';  // Make it a wall
                continue;  // Skip to next cell
            }

            // CHECK 2: Is this cell in a safe spawn area?
            if (this.isInSpawnArea(row, col)) {
                this.map[row][col].type = 'empty';  // Keep it empty
                continue;  // Skip to next cell
            }

            // CHECK 3: Checkerboard pattern for inner walls
            // Place walls at positions where BOTH row AND col are even
            const isInnerWall = (row % 2 === 0 && col % 2 === 0);
            
            if (isInnerWall) {
                this.map[row][col].type = 'wall';
            }
        }
    }
}
```

**What happens at each position:**

| Position | Check 1: Border? | Check 2: Spawn? | Check 3: Even row & col? | Result |
|----------|------------------|-----------------|---------------------------|--------|
| [0, 0]   | ✅ Yes          | -               | -                         | Wall   |
| [0, 7]   | ✅ Yes          | -               | -                         | Wall   |
| [1, 1]   | ❌ No           | ✅ Yes          | -                         | Empty  |
| [2, 2]   | ❌ No           | ❌ No           | ✅ Yes (2%2=0, 2%2=0)     | Wall   |
| [2, 3]   | ❌ No           | ❌ No           | ❌ No (2%2=0, 3%2=1)      | Empty  |
| [3, 2]   | ❌ No           | ❌ No           | ❌ No (3%2=1, 2%2=0)      | Empty  |

**Visual result:**
```
W W W W W W W W W W W W W W W   ← Row 0 (all borders)
W . . . . . . . . . . . . . W   ← Row 1
W . W . W . W . W . W . W . W   ← Row 2 (checkerboard)
W . . . . . . . . . . . . . W   ← Row 3
W . W . W . W . W . W . W . W   ← Row 4 (checkerboard)
...

Legend:
W = Wall (indestructible)
. = Empty space
```

---

## Example 3: Placing Random Blocks

**Location:** `mapGenerator.js` - `placeBlocks()` method

**Purpose:** Randomly place destructible blocks with 60% probability

```javascript
placeBlocks() {
    // OUTER LOOP: Go through each row
    for (let row = 0; row < this.rows; row++) {
        
        // INNER LOOP: Go through each column
        for (let col = 0; col < this.cols; col++) {
            const cell = this.map[row][col];

            // SKIP 1: Already a wall? Don't overwrite it
            if (cell.type === 'wall') continue;
            
            // SKIP 2: In spawn area? Keep it clear for players
            if (this.isInSpawnArea(row, col)) continue;

            // RANDOM PLACEMENT: 60% chance to place a block
            if (Math.random() < 0.6) { 
                cell.type = 'block';
            }
            // Otherwise, leave it as 'empty'
        }
    }
}
```

**What happens at each position:**

| Position | Type Before | In Spawn? | Random Value | Action |
|----------|-------------|-----------|--------------|--------|
| [1, 1]   | empty       | ✅ Yes    | -            | Skip (keep clear) |
| [1, 5]   | empty       | ❌ No     | 0.45 < 0.6   | Place block |
| [1, 6]   | empty       | ❌ No     | 0.72 > 0.6   | Leave empty |
| [2, 2]   | wall        | -         | -            | Skip (already wall) |
| [3, 4]   | empty       | ❌ No     | 0.23 < 0.6   | Place block |

**Visual result:**
```
W W W W W W W W W W W W W W W
W . . . B . B . B B . . . . W
W . W . W B W . W . W B W . W
W . . B . . B . . B B . . . W
...

Legend:
W = Wall (indestructible)
B = Block (destructible)
. = Empty space
```

---

## Example 4: Clearing Spawn Areas

**Location:** `mapGenerator.js` - `clearSpawnAreas()` method

**Purpose:** Ensure the 4 corner areas (3×3 each) are completely empty

```javascript
clearSpawnAreas() {
    // OUTER LOOP: Go through each row
    for (let row = 0; row < this.rows; row++) {
        
        // INNER LOOP: Go through each column
        for (let col = 0; col < this.cols; col++) {
            
            // SKIP: Don't clear border walls (we need those!)
            if (this.map[row][col].type === 'wall') continue;

            // CHECK: Is this position in one of the 4 spawn corners?
            if (this.isInSpawnArea(row, col)) {
                this.map[row][col].type = 'empty';  // Force it to empty
            }
        }
    }
}
```

**The 4 spawn areas (3×3 each):**
```
Top-Left Corner:         Top-Right Corner:
[1,1] [1,2] [1,3]       [1,12] [1,13] [1,14]
[2,1] [2,2] [2,3]       [2,12] [2,13] [2,14]
[3,1] [3,2] [3,3]       [3,12] [3,13] [3,14]

Bottom-Left Corner:      Bottom-Right Corner:
[9,1]  [9,2]  [9,3]     [9,12]  [9,13]  [9,14]
[10,1] [10,2] [10,3]    [10,12] [10,13] [10,14]
[11,1] [11,2] [11,3]    [11,12] [11,13] [11,14]
```

---

## Why Do We Need Nested Loops?

**Simple answer:** Because the map is **2-dimensional** (has rows AND columns).

- **1D data** (like a list): 1 loop
  ```javascript
  for (let i = 0; i < items.length; i++) {
      // Process items[i]
  }
  ```

- **2D data** (like a grid): 2 loops (nested)
  ```javascript
  for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
          // Process map[row][col]
      }
  }
  ```

---

## Performance

**Time Complexity:** O(rows × cols) = O(13 × 15) = O(195)

This means:
- Each method visits every cell exactly once
- Total operations: 195 per method
- Very efficient for a small grid like this

If the grid was 1000×1000, it would be 1,000,000 operations (still fast for modern computers).

---

## Common Pattern

All 4 methods follow the same pattern:

```javascript
methodName() {
    for (let row = 0; row < this.rows; row++) {      // Outer loop
        for (let col = 0; col < this.cols; col++) {  // Inner loop
            
            // Get current cell
            const cell = this.map[row][col];
            
            // Apply some logic or condition
            if (someCondition) {
                cell.type = 'something';
            }
        }
    }
}
```

**Key takeaway:** Nested loops let you visit every position [row, col] in a 2D grid systematically, from top-left to bottom-right.

---

## Summary

| Method | Purpose | What It Does |
|--------|---------|--------------|
| `createEmptyMap()` | Initialize | Create 195 empty cells |
| `placeWalls()` | Add structure | Place border walls + checkerboard pattern |
| `placeBlocks()` | Add obstacles | Randomly place destructible blocks (60% chance) |
| `clearSpawnAreas()` | Safety check | Ensure 4 corners are empty for player spawns |

All methods use **nested loops** because they work with a **2D grid structure**.
