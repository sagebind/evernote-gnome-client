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


const NoteWindow = new Lang.Class({
    Name: "NoteWindow",
    Extends: Gtk.Window,

    _init: function(application, uri)
    {
        this.parent({
            application: application
        });

        this._headerBar = new Gtk.HeaderBar();
        this._headerBar.title = "Evernote";
        this._headerBar.show_close_button = true;
        this.set_titlebar(this._headerBar);

        this._newNoteButton = new Gtk.Button({label: "New Note"});
        this._newNoteButton.connect("clicked", Lang.bind(this, this.newNote));
        this._headerBar.pack_start(this._newNoteButton);

        this._nextNoteButton = new Gtk.Button({
            image: new Gtk.Image({icon_name: "go-next-symbolic"})
        });
        this._nextNoteButton.connect("clicked", Lang.bind(this, this.nextNote));
        this._headerBar.pack_end(this._nextNoteButton);

        this._prevNoteButton = new Gtk.Button({
            image: new Gtk.Image({icon_name: "go-previous-symbolic"})
        });
        this._prevNoteButton.connect("clicked", Lang.bind(this, this.previousNote));
        this._headerBar.pack_end(this._prevNoteButton);

        // create a web frame
        this._webFrame = new WebFrame.WebFrame();
        this._webFrame.setZoomLevel(this.application.settings.dpiScale);
        this._webFrame.connect("document-ready", Lang.bind(this, this._onDocumentLoaded));

        // add custom css
        this._webFrame.stylesheets.push("../data/note.css");

        this.add(this._webFrame);

        this.set_default_size(800, 640);
    },

    newNote: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        document.query_selector("#gwt-debug-newNoteButton").click();
    },

    nextNote: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        document.query_selector("#gwt-debug-nav .nextNoteIcon").click();
    },

    previousNote: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        document.query_selector("#gwt-debug-nav .previousNoteIcon").click();
    },

    getNoteTitle: function()
    {
        let titleElement = this._webFrame._webView.get_dom_document().query_selector("#gwt-debug-noteTitle");

        if (titleElement)
        {
            return titleElement.innerText;
        }

        return undefined;
    },

    updateTitle: function()
    {
        let title = this.getNoteTitle();

        if (title != undefined)
        {
            this._headerBar.title = title;
        }
    },

    _onDocumentLoaded: function()
    {
        let document = this._webFrame._webView.get_dom_document();

        this.updateTitle();

        let noteCount = document.query_selector("#gwt-debug-nav span");
        if (noteCount)
            this._headerBar.subtitle = noteCount.innerText;
    }
});
