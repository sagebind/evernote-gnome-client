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
        this.widget = new Gtk.ScrolledWindow();

        this._webView = new WebKit.WebView();
        this._webView.settings.enable_page_cache = true;
        this._webView.settings.enable_smooth_scrolling = true;
        this._webView.settings.enable_spell_checking = true;

        this._webView.connect("document-load-finished", Lang.bind(this, this._onDocumentLoadFinished));
        this._webView.connect("notify::load-status", Lang.bind(this, this._onLoadStatus));
        this.widget.add(this._webView);

        this._session = WebKit.get_default_session();
        Soup.Session.prototype.add_feature.call(this._session, new Soup.ProxyResolverDefault());
        Soup.Session.prototype.remove_feature.call(this._session, new Soup.CookieJar());

        this._cookieJar = new Soup.CookieJarDB({ filename: "../data/cookies.sqlite", read_only: false });
        Soup.Session.prototype.add_feature.call(this._session, this._cookieJar);
    },

    navigate: function(uri)
    {
        this._webView.load_uri(uri);
    },

    refresh: function()
    {
        this._webView.refresh();
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
    },

    _onDocumentLoadFinished: function(webView, webFrame, userData)
    {
        this.emit("document-loaded");
    }
});

Signals.addSignalMethods(WebFrame.prototype);
