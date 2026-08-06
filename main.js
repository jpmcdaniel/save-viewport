import OBR from "@owlbear-rodeo/sdk";

let lastPosition = null;
let lastScale = null;
let debounceTimer = null;

// Helper to check if coordinates or scale changed significantly
function hasChanged(newPos, newScale) {
  if (!lastPosition || lastScale === null) return true;

  const dx = Math.abs(newPos.x - lastPosition.x);
  const dy = Math.abs(newPos.y - lastPosition.y);
  const dScale = Math.abs(newScale - lastScale);

  // Trigger if moved by more than 1 unit or zoom changed
  return dx > 1 || dy > 1 || dScale > 0.001;
}

OBR.onReady(() => {
  // Poll the viewport state every 100ms
  setInterval(async () => {
    // Verify scene is ready before querying viewport
    const isReady = await OBR.scene.isReady();
    if (!isReady) return;

    const currentPosition = await OBR.viewport.getPosition();
    const currentScale = await OBR.viewport.getScale();

    if (hasChanged(currentPosition, currentScale)) {
      // Update cached values
      lastPosition = currentPosition;
      lastScale = currentScale;

      // Reset debounce timer on movement
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Trigger notification 500ms after camera comes to rest
      debounceTimer = setTimeout(() => {
        const x = Math.round(currentPosition.x);
        const y = Math.round(currentPosition.y);
        const zoom = currentScale.toFixed(2);

        OBR.notification.show(`Viewport settled — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
      }, 500);
    }
  }, 100);
});
