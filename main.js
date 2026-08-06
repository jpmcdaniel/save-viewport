import OBR from "@owlbear-rodeo/sdk";

// Define a unique key for your extension's metadata
const ID = "com.save-viewport.app";

OBR.onReady(() => {
  console.log("Save Viewport Extension Ready");
});

/**
 * Saves the current viewport camera position to scene metadata.
 */
async function saveCurrentViewport() {
  // 1. Get current position { x, y } and zoom factor from viewport
  const position = await OBR.viewport.getPosition();
  const scale = await OBR.viewport.getScale();

  const viewportData = {
    position,
    scale,
    savedAt: Date.now()
  };

  // 2. Save into scene metadata using your unique key
  await OBR.scene.setMetadata({
    [`${ID}/savedViewport`]: viewportData
  });

  OBR.notification.show("Viewport saved to scene!");
}

/**
 * Restores the camera position from scene metadata.
 */
async function restoreSavedViewport() {
  // 1. Read current scene metadata
  const metadata = await OBR.scene.getMetadata();
  const savedData = metadata[`${ID}/savedViewport`];

  if (savedData) {
    // 2. Set position and scale simultaneously
    await OBR.viewport.animateTo({
      position: savedData.position,
      scale: savedData.scale,
    });
    
    OBR.notification.show("Restored saved viewport!");
  } else {
    OBR.notification.show("No saved viewport found for this scene.");
  }
}
