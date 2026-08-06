import OBR from "@owlbear-rodeo/sdk";

// Unique namespace key to store extension data in scene metadata
const METADATA_KEY = "com.save-viewport.app/viewport";

let lastPosition = null;
let lastScale = null;
let debounceTimer = null;
let isRestoring = false; // Flag to prevent infinite save loops during animation

// Helper to check if camera moved significantly
function hasChanged(newPos, newScale) {
  if (!lastPosition || lastScale === null) return true;

  const dx = Math.abs(newPos.x - lastPosition.x);
  const dy = Math.abs(newPos.y - lastPosition.y);
  const dScale = Math.abs(newScale - lastScale);

  return dx > 1 || dy > 1 || dScale > 0.001;
}

/**
 * Loads saved viewport coordinates from scene metadata and animates the camera.
 * Works for both GMs and Players.
 */
async function restoreSavedViewport() {
  try {
    const metadata = await OBR.scene.getMetadata();
    const savedViewport = metadata[METADATA_KEY];

    if (savedViewport && savedViewport.position && savedViewport.scale) {
      isRestoring = true;

      // Move camera to saved position
      await OBR.viewport.animateTo({
        position: savedViewport.position,
        scale: savedViewport.scale,
      });

      // Update cached state so polling doesn't treat restoration as manual movement
      lastPosition = savedViewport.position;
      lastScale = savedViewport.scale;

      const x = Math.round(savedViewport.position.x);
      const y = Math.round(savedViewport.position.y);
      const zoom = savedViewport.scale.toFixed(2);

      console.log(`[Save Viewport] Restored Viewport — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);

      // Re-enable tracking after camera movement completes
      setTimeout(() => {
        isRestoring = false;
      }, 600);
    }
  } catch (error) {
    console.warn("[Save Viewport] Could not restore viewport (engine not ready yet):", error.message);
  }
}

/**
 * Saves current viewport values to scene metadata (GM Only).
 */
async function saveViewportToMetadata(position, scale) {
  try {
    // Double-check GM role before executing write operations
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

  // 1. Listen for scene load events to restore saved viewport for everyone
  OBR.scene.onReadyChange(async (isReady) => {
    if (isReady) {
      // Small delay to allow the canvas rendering engine to attach completely
      setTimeout(() => {
        restoreSavedViewport();
      }, 200);
    }
  });

  // Check if scene is already ready when extension initializes
  OBR.scene.isReady().then((isReady) => {
    if (isReady) {
      setTimeout(() => {
        restoreSavedViewport();
      }, 200);
    }
  });

  // 2. Poll for viewport changes while user pans/zooms
  setInterval(async () => {
    if (isRestoring) return; // Skip tracking during restore animation

    try {
      // Exit early if the player is not a GM
      const role = await OBR.player.getRole();
      if (role !== "GM") return;

      const isReady = await OBR.scene.isReady();
      if (!isReady) return;

      // Wrap viewport reads safely
      const currentPosition = await OBR.viewport.getPosition();
      const currentScale = await OBR.viewport.getScale();

      if (hasChanged(currentPosition, currentScale)) {
        lastPosition = currentPosition;
        lastScale = currentScale;

        // Reset debounce timer while GM is moving the camera
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Wait 500ms after GM camera stops, then save to metadata
        debounceTimer = setTimeout(() => {
          saveViewportToMetadata(currentPosition, currentScale);
        }, 500);
      }
    } catch (e) {
      // Engine not bound yet (e.g. mid-scene transition) — safely ignore this tick
    }
  }, 100);
});
