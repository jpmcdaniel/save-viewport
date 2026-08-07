---
title: Save Viewport
description: This extension will save the latest GM view of every scene and move to that viewpoint when ever the scene is loaded.
author: jpmcdaniel
image: 
icon: https://save-viewport.pupok.com/icon.svg
tags:
  - tool
manifest: https://save-viewport.pupok.com/manifest.json
learn-more: https://save-viewport.pupok.com/docs/learn_more.html
---
# Save Viewport

**Save Viewport** keeps your game focused by automatically bookmarking and restoring camera views across scenes in Owlbear Rodeo. 

When a GM pans or zooms around a map, the extension quietly tracks the camera movement in the background. Once the camera comes to rest, **Save Viewport** attaches the exact coordinates and zoom level directly to that scene's metadata. Whenever you or your players switch to or reload that scene, the view automatically animates straight back to the saved position.

### Key Features

* **Automatic Scene Persistence:** Remembers camera pan and zoom levels per scene without requiring manual bookmarks or user interaction.
* **GM-Only Controls:** Built-in role permissions ensure player pan/zoom movements won't overwrite the GM's saved scene view.
* **Smooth Restorations:** Automatically animates the camera to the saved coordinates whenever a scene finishes loading for players or GMs.
* **Zero-UI Background Worker:** Operates silently in the background with no extra buttons, popovers, or floating menus cluttering your toolbar.
* **Performance-Friendly:** Uses intelligent 500 ms movement debouncing and engine-bound safety guards to keep resource usage minimal and free of console errors.

---

### Setup Instructions

1. Copy the manifest URL: `https://save-viewport.pupok.com/manifest.json`.
2. In Owlbear Rodeo, open **Settings** > **Extensions**.
3. Click **+** (Add Extension), paste the manifest URL, and click **Install**.

