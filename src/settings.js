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

const Gio = imports.gi.Gio;
const GioSSS = Gio.SettingsSchemaSource;
const GLib = imports.gi.GLib;
const Lang = imports.lang;


const Settings = new Lang.Class({
    Name: "Settings",
    Extends: Gio.Settings,

    _init: function(schema) {
        let schemaSource = GioSSS.new_from_directory("schemas", GioSSS.get_default(), false);
        let schemaObj = schemaSource.lookup(schema, true);
        if (!schemaObj)
            throw new Error('Schema ' + schema + ' could not be found. Please check your installation.');

        this.parent({ settings_schema: schemaObj });
    },

    get: function(key) {
        return this.get_value(key).deep_unpack();
    },

    set: function(key, type, value) {
        return this.set_value(key, new GLib.Variant(type, value));
    }
});
