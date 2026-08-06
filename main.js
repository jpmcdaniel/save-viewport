import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(() => {
  document.getElementById('status').innerText = "Connected to room successfully!";
});
