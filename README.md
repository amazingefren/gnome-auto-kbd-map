# Auto X11 Kbd Switcher

A GNOME Shell extension that automatically switches between Dvorak and QWERTY keyboard layouts based on the active window.

## What it does

- Monitors active windows and switches keyboard layouts automatically
- Uses Dvorak layout by default for most applications
- Switches to QWERTY layout when Steam games are detected
- Provides a panel indicator showing current layout and window class
- Includes a "Refresh Layout" option in the panel menu

## How it works

The extension detects Steam games by matching window class names against patterns like `steam_app_`, `gameoverlayui`, and `steam_proton`. When a Steam game is active, it switches to QWERTY layout using `setxkbmap`. For everything else, it uses Dvorak.

## Installation

Copy or symlink this directory to `~/.local/share/gnome-shell/extensions/` and enable it with:

```bash
gnome-extensions enable gnome-auto-kbd-map@amazingefren.com
```

## Note

I have no idea what I'm doing when it comes to making GNOME extensions, but this seems to work for my use case. Use at your own risk.

## Requirements

- GNOME Shell 48
- X11 (uses `setxkbmap`)