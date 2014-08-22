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

const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Signals = imports.signals;
const Soup = imports.gi.Soup;
const WebKit = imports.gi.WebKit;


const WebFrame = new Lang.Class({
    Name: "WebFrame",
    Extends: Gtk.Overlay,
    stylesheets: [],

    _init: function(application)
    {
        this.parent();
        this.application = application;
        this.get_style_context().add_class("web-frame");

        this._frame = new Gtk.ScrolledWindow();
        this.add(this._frame);

        this._webView = new WebKit.WebView();
        this._webView.full_content_zoom = true;
        this._webView.zoom_level = application.settings.dpiScale;
        this._webView.settings.enable_page_cache = true;
        this._webView.settings.enable_smooth_scrolling = true;
        this._webView.settings.enable_spell_checking = true;

        this._webView.connect("notify::load-status", Lang.bind(this, this._onLoadStatus));
        this._webView.connect("document-load-finished", Lang.bind(this, this._onDocumentLoadFinished));
        this._webView.connect("new-window-policy-decision-requested", Lang.bind(this, this._onNewWindowRequested));
        this._frame.add(this._webView);

        this._session = WebKit.get_default_session();
        Soup.Session.prototype.add_feature.call(this._session, new Soup.ProxyResolverDefault());
        Soup.Session.prototype.remove_feature.call(this._session, new Soup.CookieJar());

        this._cookieJar = new Soup.CookieJarDB({ filename: "../data/cookies.sqlite", read_only: false });
        Soup.Session.prototype.add_feature.call(this._session, this._cookieJar);

        this._spinner = new Gtk.Spinner();
        this.add_overlay(this._spinner);
        this._showSpinner();
    },

    getWindow: function()
    {
        return this._webView.get_main_frame().get_global_context();
    },

    navigate: function(uri)
    {
        this._webView.load_uri(uri);
    },

    refresh: function()
    {
        this._webView.refresh();
    },

    _showSpinner: function()
    {
        this._webView.get_style_context().add_class("loading");
        this._spinner.start();
        this._spinner.show();
    },

    _hideSpinner: function()
    {
        this._spinner.hide();
        this._spinner.stop();
        this._webView.get_style_context().remove_class("loading");
    },

    _onLoadStatus: function(webView, userData)
    {
        // is the document ready?
        if (webView.load_status == 3)
        {
            this.emit("load-finished", webView, userData);

            for (let stylesheet in this.stylesheets)
            {
                // create a style element
                let styleElement = webView.get_dom_document().create_element("style");

                // load stylesheet file
                let result = GLib.file_get_contents(this.stylesheets[stylesheet]);

                // loaded successfully
                if (result[0])
                {
                    // add css styles
                    styleElement.set_inner_text(String(result[1]));

                    // add styles to document
                    webView.get_dom_document().head.append_child(styleElement);
                }
            }
        }

        else if (webView.load_status < 2)
        {
            //this._showSpinner();
        }
    },

    _onDocumentLoadFinished: function(webView, webFrame, userData)
    {
        this._hideSpinner();
        this.emit("document-loaded");
    },

    _onNewWindowRequested: function(webView, frame, request, navigationAction, policyDecision, userData)
    {
        log("Opening external link: " + request.uri);

        // open url in default browser
        GLib.spawn_command_line_async("xdg-open " + request.uri);

        policyDecision.ignore();
        return true;
    }
});

Signals.addSignalMethods(WebFrame.prototype);
