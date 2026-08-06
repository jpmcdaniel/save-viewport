import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(() => {
  // Listen for scene ready state changes
  OBR.scene.onReadyChange((isReady) => {
    if (isReady) {
      OBR.notification.show("Scene loaded!");
    }
  });
});
