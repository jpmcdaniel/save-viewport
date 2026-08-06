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
 */
async function restoreSavedViewport() {
  const metadata = await OBR.scene.getMetadata();
  const savedViewport = metadata[METADATA_KEY];

  if (savedViewport && savedViewport.position && savedViewport.scale) {
    isRestoring = true;

    // Move camera to saved position
    await OBR.viewport.animateTo({
      position: savedViewport.position,
      scale: savedViewport.scale,
    });

    // Update internal state so polling doesn't treat the restore motion as a new manual move
    lastPosition = savedViewport.position;
    lastScale = savedViewport.scale;

    const x = Math.round(savedViewport.position.x);
    const y = Math.round(savedViewport.position.y);
    const zoom = savedViewport.scale.toFixed(2);

    OBR.notification.show(`Restored Viewport — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);

    // Allow manual tracking again after animation completes
    setTimeout(() => {
      isRestoring = false;
    }, 600);
  }
}

/**
 * Saves current viewport values to scene metadata.
 */
async function saveViewportToMetadata(position, scale) {
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

  OBR.notification.show(`Saved Viewport — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
}

OBR.onReady(() => {
  // 1. Listen for scene ready / load events to restore saved viewport
  OBR.scene.onReadyChange(async (isReady) => {
    if (isReady) {
      await restoreSavedViewport();
    }
  });

  // Check if a scene is already ready when extension initializes
  OBR.scene.isReady().then((isReady) => {
    if (isReady) {
      restoreSavedViewport();
    }
  });

  // 2. Poll for viewport changes while user pans/zooms
  setInterval(async () => {
    if (isRestoring) return; // Skip tracking while animating camera on restore

    const isReady = await OBR.scene.isReady();
    if (!isReady) return;

    const currentPosition = await OBR.viewport.getPosition();
    const currentScale = await OBR.viewport.getScale();

    if (hasChanged(currentPosition, currentScale)) {
      lastPosition = currentPosition;
      lastScale = currentScale;

      // Clear existing debounce timer while moving
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Wait 500ms after camera stops moving, then save to metadata
      debounceTimer = setTimeout(() => {
        saveViewportToMetadata(currentPosition, currentScale);
      }, 500);
    }
  }, 100);
});
