# Player Sprite Animation Guide

## Overview
The player movement animation system now uses a **sprite sheet** - a single image containing multiple frames of the player in different poses and directions. This allows the player to look like they're actually walking with moving limbs instead of just sliding as a static image.

## Sprite Sheet Format Required

Your `public/assets/player.png` sprite sheet should be organized as:
- **4 rows** (one for each direction): Down, Left, Right, Up
- **4 columns** (animation frames per direction): Frame 1, Frame 2, Frame 3, Frame 4

### Visual Layout:
```
┌─────────┬─────────┬─────────┬─────────┐
│  Down   │  Down   │  Down   │  Down   │  (Row 0)
│ Frame1  │ Frame2  │ Frame3  │ Frame4  │
├─────────┼─────────┼─────────┼─────────┤
│  Left   │  Left   │  Left   │  Left   │  (Row 1)
│ Frame1  │ Frame2  │ Frame3  │ Frame4  │
├─────────┼─────────┼─────────┼─────────┤
│ Right   │ Right   │ Right   │ Right   │  (Row 2)
│ Frame1  │ Frame2  │ Frame3  │ Frame4  │
├─────────┼─────────┼─────────┼─────────┤
│   Up    │   Up    │   Up    │   Up    │  (Row 3)
│ Frame1  │ Frame2  │ Frame3  │ Frame4  │
└─────────┴─────────┴─────────┴─────────┘
```

## Direction Mapping
- **Direction 0**: Down (moving downward)
- **Direction 1**: Left (moving left)
- **Direction 2**: Right (moving right)
- **Direction 3**: Up (moving upward)

## Creating Your Sprite Sheet

You can create this using:
1. **Online tools**: sprite-sheet generators or image editors
2. **Aseprite**: Professional sprite editor
3. **Piskel**: Free online pixel art editor
4. **Photoshop/GIMP**: Manual tiling

### Tips for Best Results:
- Each frame should be **32x32 pixels** (matches `PLAYER_SIZE` in player.js)
- Total image size: **128x128 pixels** (4x4 grid of 32x32 frames)
- Frame 1 should always be a neutral/idle pose
- Frames 2-4 should show walking animation (legs moving, arms swinging)
- Keep the character centered in each frame

## Animation Speed

The animation speed is controlled by the `ANIMATION_SPEED` constant in `player.js`:
- **Lower values** = Faster animation (5-10 recommended)
- **Higher values** = Slower animation (15-20)

Currently set to: `10 frames per animation cycle`

To adjust: Edit line ~10 in `src/player/player.js`

## How It Works

1. **Movement Input**: When the player presses arrow keys, the direction is recorded
2. **Frame Update**: Every frame cycle, the animation frame index increments
3. **Sprite Positioning**: JavaScript calculates the background-position percentage based on:
   - Current direction (which row in the sprite sheet)
   - Current animation frame (which column in the sprite sheet)
4. **Result**: The player appears to walk in the direction they're moving!

## Browser Compatibility

This uses standard CSS `background-position` and works in all modern browsers.

## Troubleshooting

**Animation not showing?**
- Check that `player.png` exists in `public/assets/`
- Verify sprite sheet is exactly **128x128px** with 4x4 grid
- Clear browser cache (Ctrl+F5)

**Animation too fast/slow?**
- Adjust `ANIMATION_SPEED` in player.js (line ~10)

**Character looks distorted?**
- Ensure each frame in the sprite sheet is exactly **32x32px**
