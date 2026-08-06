import OBR from "@owlbear-rodeo/sdk";

console.log("[Save Viewport] Script loaded into browser memory");

let debounceTimer = null;

OBR.onReady(() => {
  console.log("[Save Viewport] OBR.onReady triggered successfully!");

  // Test notification on startup
  OBR.notification.show("Save Viewport loaded and listening...");

  // Subscribe to viewport changes
  OBR.viewport.onChange((viewport) => {
    console.log("[Save Viewport] Viewport changed:", viewport);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      const x = Math.round(viewport.position.x);
      const y = Math.round(viewport.position.y);
      const zoom = viewport.scale.toFixed(2);

      console.log(`[Save Viewport] Viewport settled: X=${x}, Y=${y}, Zoom=${zoom}`);
      OBR.notification.show(`Viewport settled — X: ${x}, Y: ${y}, Zoom: ${zoom}x`);
    }, 500);
  });
});
