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
    stylesheets: [],

    _init: function()
    {
        this.widget = new Gtk.Overlay();
        this.widget.get_style_context().add_class("web-frame");

        this._frame = new Gtk.ScrolledWindow();
        this.widget.add(this._frame);

        this._webView = new WebKit.WebView();
        this._webView.settings.enable_page_cache = true;
        this._webView.settings.enable_smooth_scrolling = true;
        this._webView.settings.enable_spell_checking = true;

        this._webView.connect("document-load-finished", Lang.bind(this, this._onDocumentLoadFinished));
        this._webView.connect("notify::load-status", Lang.bind(this, this._onLoadStatus));
        this._frame.add(this._webView);

        this._session = WebKit.get_default_session();
        Soup.Session.prototype.add_feature.call(this._session, new Soup.ProxyResolverDefault());
        Soup.Session.prototype.remove_feature.call(this._session, new Soup.CookieJar());

        this._cookieJar = new Soup.CookieJarDB({ filename: "../data/cookies.sqlite", read_only: false });
        Soup.Session.prototype.add_feature.call(this._session, this._cookieJar);

        this._spinner = new Gtk.Spinner();
        this.widget.add_overlay(this._spinner);
        this.showSpinner();
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

    showSpinner: function()
    {
        this._webView.get_style_context().add_class("loading");
        this._spinner.start();
        this._spinner.show();
    },

    hideSpinner: function()
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

        else
        {
            this.showSpinner();
        }
    },

    _onDocumentLoadFinished: function(webView, webFrame, userData)
    {
        this.hideSpinner();
        this.emit("document-loaded");
    }
});

Signals.addSignalMethods(WebFrame.prototype);
