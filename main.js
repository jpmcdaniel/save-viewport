import OBR from "@owlbear-rodeo/sdk";

let debounceTimer = null;

OBR.onReady(() => {
  // Listen for changes to the viewport (pan or zoom)
  OBR.viewport.onChange((viewport) => {
    // Clear any pending notification timer while camera is still moving
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set a new timer to fire 500ms after the camera comes to rest
    debounceTimer = setTimeout(() => {
      const x = Math.round(viewport.position.x);
      const y = Math.round(viewport.position.y);
      const zoom = viewport.scale.toFixed(2);

      OBR.notification.show(`Viewport settled — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
    }, 500);
  });
});
