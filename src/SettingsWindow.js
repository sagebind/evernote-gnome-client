/**
 * Copyright (c) 2014 Stephen Coakley <me@stephencoakley.com>
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const WebFrame = imports.WebFrame;


const SettingsWindow = new Lang.Class({
    Name: "SettingsWindow",
    Extends: Gtk.Window,

    _init: function(application)
    {
        this.parent({
            application: application
        });

        this._headerBar = new Gtk.HeaderBar();
        this._headerBar.title = "Evernote Account Settings";
        this._headerBar.show_close_button = true;
        this.set_titlebar(this._headerBar);

        // create a web frame
        this._webFrame = new WebFrame.WebFrame();
        this.add(this._webFrame);

        // add custom css
        this._webFrame.stylesheets.push("../data/settings.css");

        // load main evernote interface
        this._webFrame.navigate("https://www.evernote.com/Settings.action");

        this.set_default_size(1024, 768);
    }
});
