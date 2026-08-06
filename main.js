import OBR from "@owlbear-rodeo/sdk";

let debounceTimer = null;

OBR.onReady(() => {
  // Listen for any camera movement or zoom adjustments
  OBR.viewport.onChange((viewport) => {
    // Clear existing timer as long as the viewport is actively moving
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Wait 500ms after movement stops before showing the notification
    debounceTimer = setTimeout(() => {
      const x = Math.round(viewport.position.x);
      const y = Math.round(viewport.position.y);
      const zoom = viewport.scale.toFixed(2);

      OBR.notification.show(`Viewport settled — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
    }, 500);
  });
});
