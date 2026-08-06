import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(() => {
  // Listen for scene ready state changes
  OBR.scene.onReadyChange(async (isReady) => {
    if (isReady) {
      // Fetch current viewport position { x, y } and scale (zoom factor)
      const position = await OBR.viewport.getPosition();
      const scale = await OBR.viewport.getScale();

      // Format coordinates for readability
      const x = Math.round(position.x);
      const y = Math.round(position.y);
      const zoom = scale.toFixed(2);

      // Show notification with viewport specifics
      OBR.notification.show(`Scene loaded! Viewport: X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
    }
  });
});
