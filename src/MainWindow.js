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

const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const NoteWindow = imports.NoteWindow;
const WebFrame = imports.WebFrame;


const MainWindow = new Lang.Class({
    Name: "MainWindow",
    Extends: Gtk.Window,

    _init: function(application)
    {
        this.parent({
            application: application,
            icon_name: "chrome-lbfehkoinhhcknnbdgnnmjhiladcgbol-Default"
        });

        // apply the last saved window size and position
        if (this.application.settings)
        {
            this.set_default_size(
                this.application.settings.windowSize[0],
                this.application.settings.windowSize[1]
            );
            this.move(
                this.application.settings.windowPosition[0],
                this.application.settings.windowPosition[1]
            );

            if (this.application.settings.windowMaximized != false)
            {
                //this._window.maximize();
            }
        }

        this.connect('configure-event', Lang.bind(this, this._onConfigureEvent));
        this.connect('window-state-event', Lang.bind(this, this._onWindowStateEvent));

        this._headerBar = new Gtk.HeaderBar();
        this._headerBar.title = "Evernote";
        this._headerBar.show_close_button = true;
        this.set_titlebar(this._headerBar);

        this._newNoteButton = new Gtk.Button({label: "New Note"});
        this._newNoteButton.connect("clicked", Lang.bind(this, this.newNote));
        this._headerBar.pack_start(this._newNoteButton);

        this._searchEntry = new Gtk.SearchEntry();
        this._searchEntry.width_request = 320;
        this._searchEntry.connect("search-changed", Lang.bind(this, this._onSearchChanged));
        this._headerBar.pack_end(this._searchEntry);

        // create a web frame
        this._webFrame = new WebFrame.WebFrame(application);
        this._webFrame.setZoomLevel(this.application.settings.dpiScale);
        this.add(this._webFrame);

        // listen for popup requests
        this._webFrame._webView.connect("navigation-policy-decision-requested", Lang.bind(this, this._webView_onNavigationRequested));
        this._webFrame._webView.connect("create-web-view", Lang.bind(this, this._webView_onCreateWebView));
        this._webFrame.connect("document-ready", Lang.bind(this, this._webView_onDocumentLoaded));

        // add custom css
        this._webFrame.stylesheets.push("../data/main-window.css");

        // load main evernote interface
        this._webFrame.navigate("https://www.evernote.com/Home.action");
    },

    newNote: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        document.query_selector("#gwt-debug-newNoteButton").click();
    },

    search: function(query)
    {
        log("Executing search: \"" + query + "\"");

        let document = this._webFrame._webView.get_dom_document();

        // clear internal search box
        document.query_selector("img[width='16']").click();

        // populate search box with query
        document.query_selector("#gwt-debug-searchBox input").value = query;

        // execute search
        document.query_selector("#gwt-debug-searchSubmit").click();
    },

    getCurrentSearchText: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        var searchText = "";

        let lozengeContainer = document.query_selector("#gwt-debug-lozengeContainer");

        if (lozengeContainer)
        {
            // get flag elements
            let flagElements = lozengeContainer.query_selector_all(":scope > div:first-child > div > div");

            if (flagElements)
            {
                for (var i = 0; i < flagElements.length; i++)
                {
                    let typeElement = flagElements.item(i).query_selector("span:first-child");
                    let valueElement = flagElements.item(i).query_selector("span:nth-child(2)");

                    if (typeElement && valueElement)
                    {
                        var valueText = String(valueElement.innerText);
                        if (valueText.indexOf(" ") > -1)
                        {
                            valueText = "\"" + valueText + "\"";
                        }

                        if (searchText != "")
                        {
                            searchText += " ";
                        }
                        searchText += typeElement.innerText.toLowerCase() + valueText;
                    }
                }
            }
        }

        // get text search
        let searchInput = document.query_selector("#gwt-debug-searchBox input");
        if (searchInput && searchInput.value != "")
        {
            if (searchText != "")
            {
                searchText += " ";
            }
            searchText += searchInput.value;
        }

        return searchText;
    },

    _updateSearchEntry: function()
    {
        this._updatingSearchEntry = true;
        this._searchEntry.text = this.getCurrentSearchText();
    },

    _onConfigureEvent: function(widget, event)
    {
        let size = this.get_size();
        let position = this.get_position();

        if (this.application.settings.windowSize[0] != size[0] || this.application.settings.windowSize[1] != size[1])
        {
            log("Window resized: " + size);
            this.application.settings.windowSize = size;
        }

        if (this.application.settings.windowPosition[0] != position[0] || this.application.settings.windowPosition[1] != position[1])
        {
            log("Window moved: " + position);
            this.application.settings.windowPosition = position;
        }
    },

    _onWindowStateEvent: function(widget, event)
    {
        let state = this.get_state();

        if (state & Gdk.WindowState.FULLSCREEN)
            return;

        this.application.settings.windowMaximized = Boolean(state & Gdk.WindowState.MAXIMIZED);
    },

    _webView_onNavigationRequested: function(webView, frame, request, navigationAction, policyDecision, userData)
    {
        log("Loading page: " + request.uri);
    },

    _webView_onCreateWebView: function(webView, frame, userData)
    {
        let noteWindow = new NoteWindow.NoteWindow(this.application);
        noteWindow.show_all();
        return noteWindow._webFrame._webView;
    },

    _webView_onDocumentLoaded: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        let noteTitle = document.query_selector("#gwt-debug-noteTitle");
        //if (noteTitle)
            //this._headerBar.subtitle = noteTitle.innerText;

        this._updateSearchEntry();
    },

    _onSearchChanged: function(searchEntry, userData)
    {
        log("Search changed: \"" + searchEntry.text + "\"");

        if (!this._updatingSearchEntry)
        {
            this.search(searchEntry.text);
        }

        this._updatingSearchEntry = false;
    }
});
