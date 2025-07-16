/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

// Note I do not know what the fuck i'm doing with gnome

import GObject from "gi://GObject";
import St from "gi://St";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      /**
       * Initialize Indicator
       */
      super._init(0.0, "Auto Keyboard Map");

      this._icon = new St.Icon({
        icon_name: "input-keyboard-symbolic",
        style_class: "system-status-icon",
      });

      this.add_child(this._icon);

      /**
       * Initialize Menu Items
       */
      this._statusItem = new PopupMenu.PopupMenuItem("Status: Initializing...");
      this.menu.addMenuItem(this._statusItem);

      this._windowClassItem = new PopupMenu.PopupMenuItem("Window: None");
      this.menu.addMenuItem(this._windowClassItem);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let refreshItem = new PopupMenu.PopupMenuItem("Refresh Layout");
      refreshItem.connect("activate", () => {
        if (this._extension) {
          this._extension.checkAndSwitchLayout();
          Main.notify("Layout refreshed");
        }
      });
      this.menu.addMenuItem(refreshItem);

      // let testItem = new PopupMenu.PopupMenuItem("Test Notification");
      // testItem.connect("activate", () => {
      //   Main.notify("Auto Keyboard Map Extension Active");
      // });
      // this.menu.addMenuItem(testItem);
    }

    updateStatus(layout, windowClass) {
      this._statusItem.label.text = `Layout: ${layout}`;
      this._windowClassItem.label.text = `Window: ${windowClass || "None"}`;

      // Update icon color based on layout
      if (layout === "dvorak") {
        this._icon.style_class = "system-status-icon";
      } else {
        this._icon.style_class = "system-status-icon warning";
      }
    }
  },
);

export default class AutoKbdMapExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._activeWindowChangedId = null;
    this._currentWindowClass = null;
    this._currentLayout = null;
    this._steamGamePatterns = [
      "steam_app_",
      // "steamapp",
      // "steam.exe",
      "gameoverlayui",
      "steam_proton",
      // "alacritty", // just testing shit
    ];
  }

  /**
   * Get the WM_CLASS of the currently focused window
   * @returns {string|null}
   */
  getActiveWindowClass() {
    const activeWindow = global.display.focus_window;
    if (!activeWindow) return null;

    const wmClass = activeWindow.get_wm_class();
    return wmClass || null;
  }

  switchKeyboardLayout(variant) {
    if (this._currentLayout === variant) return;

    try {
      if (variant === "dvorak") {
        GLib.spawn_command_line_async("setxkbmap -layout us -variant dvorak");
        this._currentLayout = "Dvorak";
        // console.log(`[Auto-Kbd-Map] Switched to dvorak layout`);
      } else {
        GLib.spawn_command_line_async("setxkbmap -layout us");
        this._currentLayout = "Qwerty";
        // console.log(`[Auto-Kbd-Map] Switched to qwerty layout`);
      }

      if (this._indicator) {
        this._indicator.updateStatus(
          this._currentLayout,
          this._currentWindowClass,
        );
      }
    } catch (error) {
      console.error(`[Auto-Kbd-Map] Error switching keyboard layout: ${error}`);
    }
  }

  checkAndSwitchLayout() {
    const windowClass = this.getActiveWindowClass();
    if (windowClass === this._currentWindowClass) return;

    this._currentWindowClass = windowClass;
    // console.log(`[Auto-Kbd-Map] Active window class: ${windowClass || "None"}`);

    const isSteamGame = this.isSteamGame(windowClass);

    if (isSteamGame) {
      console.log(`[Auto-Kbd-Map] Steam game detected: ${windowClass}`);
      this.switchKeyboardLayout("qwerty");
    } else {
      this.switchKeyboardLayout("dvorak");
    }
  }

  isSteamGame(windowClass) {
    if (!windowClass) return false;

    const lowerClass = windowClass.toLowerCase();
    return this._steamGamePatterns.some((pattern) =>
      lowerClass.includes(pattern.toLowerCase()),
    );
  }

  onActiveWindowChanged() {
    this.checkAndSwitchLayout();
  }

  enable() {
    this._indicator = new Indicator();

    Main.panel.addToStatusArea(this.uuid, this._indicator);

    // Monitor active window changes
    this._activeWindowChangedId = global.display.connect(
      "notify::focus-window",
      this.onActiveWindowChanged.bind(this),
    );

    // Check current window on startup
    this.checkAndSwitchLayout();

    // console.log("[Auto-Kbd-Map] Auto Keyboard Map extension enabled");
  }

  disable() {
    // Disconnect window monitoring
    if (this._activeWindowChangedId) {
      global.display.disconnect(this._activeWindowChangedId);
      this._activeWindowChangedId = null;
    }

    this._indicator?.destroy();
    this._indicator = null;

    // Reset to dvorak layout when disabling
    this.switchKeyboardLayout("dvorak");

    // console.log("[Auto-Kbd-Map] Auto Keyboard Map extension disabled");
  }
}
