import OBR from "@owlbear-rodeo/sdk";

// Unique namespace key to store extension data in scene metadata
const METADATA_KEY = "com.save-viewport.app/viewport";

let lastPosition = null;
let lastScale = null;
let debounceTimer = null;
let isRestoring = false;
let isSceneInitializing = true; // Guard flag to prevent premature saves on scene load

// Helper to check if camera moved significantly
function hasChanged(newPos, newScale) {
  if (!lastPosition || lastScale === null) return false; // Don't treat initial baseline setup as a change

  const dx = Math.abs(newPos.x - lastPosition.x);
  const dy = Math.abs(newPos.y - lastPosition.y);
  const dScale = Math.abs(newScale - lastScale);

  return dx > 1 || dy > 1 || dScale > 0.001;
}

/**
 * Handles scene entry: restores saved viewport if present,
 * establishes the baseline coordinates, and opens saving after settling.
 */
async function handleSceneLoad() {
  isSceneInitializing = true;
  isRestoring = true;

  // Clear any dangling debounce timers from previous scenes
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  try {
    const metadata = await OBR.scene.getMetadata();
    const savedViewport = metadata[METADATA_KEY];

    if (savedViewport && savedViewport.position && savedViewport.scale) {
      // Animate camera to saved coordinates
      await OBR.viewport.animateTo({
        position: savedViewport.position,
        scale: savedViewport.scale,
      });

      const x = Math.round(savedViewport.position.x);
      const y = Math.round(savedViewport.position.y);
      const zoom = savedViewport.scale.toFixed(2);
      console.log(`[Save Viewport] Restored Viewport — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
    } else {
      console.log("[Save Viewport] No saved viewport found for this scene.");
    }
  } catch (error) {
    console.warn("[Save Viewport] Could not read or restore viewport metadata:", error.message);
  }

  // Wait for the animation / canvas renderer to finish settling
  setTimeout(async () => {
    try {
      // Capture the initial settled position as the clean baseline
      lastPosition = await OBR.viewport.getPosition();
      lastScale = await OBR.viewport.getScale();
    } catch (e) {
      // Fallback if engine is momentarily busy
    }

    isRestoring = false;
    isSceneInitializing = false;
    console.log("[Save Viewport] Scene initialization complete. Movement tracking enabled.");
  }, 700);
}

/**
 * Saves current viewport values to scene metadata (GM Only).
 */
async function saveViewportToMetadata(position, scale) {
  try {
    const role = await OBR.player.getRole();
    if (role !== "GM") return;

    await OBR.scene.setMetadata({
      [METADATA_KEY]: {
        position,
        scale,
        updatedAt: Date.now(),
      },
    });

    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const zoom = scale.toFixed(2);

    console.log(`[Save Viewport] GM Saved Viewport — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
  } catch (error) {
    console.warn("[Save Viewport] Could not save viewport:", error.message);
  }
}

OBR.onReady(() => {
  console.log("[Save Viewport] Extension initialized and ready.");

  // 1. Listen for scene ready / switch events
  OBR.scene.onReadyChange((isReady) => {
    if (isReady) {
      setTimeout(() => {
        handleSceneLoad();
      }, 200);
    } else {
      // Mark initializing and clear timers when scene unloads
      isSceneInitializing = true;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    }
  });

  // Handle case where room/scene is already ready on boot
  OBR.scene.isReady().then((isReady) => {
    if (isReady) {
      setTimeout(() => {
        handleSceneLoad();
      }, 200);
    }
  });

  // 2. Poll for viewport movements
  setInterval(async () => {
    // Block polling during scene loads or restore animations
    if (isSceneInitializing || isRestoring) return;

    try {
      const role = await OBR.player.getRole();
      if (role !== "GM") return;

      const isReady = await OBR.scene.isReady();
      if (!isReady) return;

      const currentPosition = await OBR.viewport.getPosition();
      const currentScale = await OBR.viewport.getScale();

      // If lastPosition is not yet established, initialize it without saving
      if (!lastPosition || lastScale === null) {
        lastPosition = currentPosition;
        lastScale = currentScale;
        return;
      }

      if (hasChanged(currentPosition, currentScale)) {
        lastPosition = currentPosition;
        lastScale = currentScale;

        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
          // Double-check flags before saving
          if (!isSceneInitializing && !isRestoring) {
            saveViewportToMetadata(currentPosition, currentScale);
          }
        }, 500);
      }
    } catch (e) {
      // Safely ignore transient unbounds during transitions
    }
  }, 100);
});
