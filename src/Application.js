const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const WebKit = imports.gi.WebKit;

const View = {
    Notes: 0,
    Settings: 1
};

const EvernoteGClient = new Lang.Class({
    Name: "EvernoteGClient",
    Extends: Gtk.Application,
    _currentView: 0,

    _init: function()
    {
        Gettext.textdomain('evernote-gnome-client');
        GLib.set_prgname('Evernote');
        GLib.set_application_name("Evernote");

        this.parent({
            application_id: "org.coderstephen.evernote-gnome-client",
            flags: Gio.ApplicationFlags.FLAGS_NONE
        });

        // load settings
        this._loadSettings();

        this.connect("startup", Lang.bind(this, this._onStartup));
        this.connect("activate", Lang.bind(this, this._onActivate));
    },

    showNotes: function()
    {
        this._webView.load_uri("https://www.evernote.com/Home.action");
    },

    showSettings: function()
    {
        this._webView.load_uri("https://www.evernote.com/Settings.action");
        this._currentView = View.Settings;
    },

    showAbout: function()
    {
        let aboutDialog = new Gtk.AboutDialog();

        aboutDialog.authors = ["Stephen Coakley <me@stephencoakley.com>"];
        aboutDialog.program_name = "Evernote Gnome Client";
        aboutDialog.comments = "A client for Evernote Web that integrates nicely with Gnome.";
        aboutDialog.copyright = "Copyright " + String.fromCharCode(0x00A9) + " 2014 Stephen Coakley.";
        aboutDialog.license_type = Gtk.License.GPL_2_0;
        aboutDialog.logo_icon_name = "chrome-lbfehkoinhhcknnbdgnnmjhiladcgbol-Default";
        aboutDialog.version = "0.1";
        aboutDialog.wrap_license = true;

        aboutDialog.modal = true;
        aboutDialog.transient_for = this._window;

        aboutDialog.show();
        aboutDialog.connect("response", function() {
            aboutDialog.destroy();
        });
    },

    newNote: function()
    {
        this._webView.execute_script("document.getElementById('gwt-debug-newNoteButton').click()");
    },

    execSearch: function()
    {
        // get the search query text
        let query = this._searchEntry.text;

        // clear internal search box
        this._webView.execute_script("document.getElementsByClassName('GM2YP5TCDQ')[0].click();");

        // populate search box with query
        this._webView.execute_script("document.getElementsByClassName('GM2YP5TCCCC')[0].value='" + query + "';");

        // execute search
        this._webView.execute_script("document.getElementById('gwt-debug-searchSubmit').click()");
    },

    _initializeWindow: function()
    {
        this._window = new Gtk.ApplicationWindow({
            application: this,
            title: "Evernote",
            icon_name: "chrome-lbfehkoinhhcknnbdgnnmjhiladcgbol-Default"
        });

        // apply the last saved window size and position
        if (this.settings)
        {
            this._window.set_default_size(this.settings.windowSize[0], this.settings.windowSize[1]);
            this._window.move(this.settings.windowPosition[0], this.settings.windowPosition[1]);

            if (this.settings.windowMaximized != false)
            {
                //this._window.maximize();
            }
        }

        this._window.connect('configure-event', Lang.bind(this, this._window_onConfigureEvent));
        this._window.connect('window-state-event', Lang.bind(this, this._window_onWindowStateEvent));
        this._window.connect("destroy", Lang.bind(this, this._window_onDestroy));
        // load custom css
        //this.customCss = this._getCustomCss();

        this._headerBar = new Gtk.HeaderBar();
        this._headerBar.title = "Evernote";
        this._headerBar.show_close_button = true;
        this._window.set_titlebar(this._headerBar);

        this._newNoteButton = new Gtk.Button({label: "New Note"});
        this._newNoteButton.connect("clicked", Lang.bind(this, this.newNote));
        this._headerBar.pack_start(this._newNoteButton);

        this._searchEntry = new Gtk.SearchEntry();
        this._searchEntry.width_request = 192;
        this._searchEntry.connect("focus-in-event", Lang.bind(this, this._searchEntry_onFocusIn));
        this._searchEntry.connect("focus-out-event", Lang.bind(this, this._searchEntry_onFocusOut));
        this._searchEntry.connect("key-press-event", Lang.bind(this, this._searchEntry_onKeyPress));
        this._headerBar.pack_end(this._searchEntry);

        // web view
        this._webView = new WebKit.WebView();
        this._session = WebKit.get_default_session();
        Soup.Session.prototype.add_feature.call(this._session, new Soup.ProxyResolverDefault());
        Soup.Session.prototype.remove_feature.call(this._session, new Soup.CookieJar());
        this._cookieJar = new Soup.CookieJarDB({ filename: "../data/cookies.sqlite", read_only: false });
        Soup.Session.prototype.add_feature.call(this._session, this._cookieJar);

        this._webView.connect("notify::load-status", Lang.bind(this, this._webView_onLoadStatus));

        let scrolledWindow = new Gtk.ScrolledWindow();
        scrolledWindow.add(this._webView);

        this._window.add(scrolledWindow);
        this._window.show_all();
    },

    _initMenus: function()
    {
        let menu = new Gio.Menu();
        menu.append("Notes", "app.notes");
        menu.append("Settings", "app.settings");
        menu.append("About", "app.about");
        menu.append("Quit","app.quit");
        this.set_app_menu(menu);

        let notesAction = new Gio.SimpleAction ({ name: "notes" });
        notesAction.connect("activate", Lang.bind(this, this.showNotes));
        this.add_action(notesAction);

        let settingsAction = new Gio.SimpleAction ({ name: "settings" });
        settingsAction.connect("activate", Lang.bind(this, this.showSettings));
        this.add_action(settingsAction);

        let aboutAction = new Gio.SimpleAction ({ name: "about" });
        aboutAction.connect("activate", Lang.bind(this, this.showAbout));
        this.add_action(aboutAction);

        let quitAction = new Gio.SimpleAction ({ name: "quit" });
        quitAction.connect("activate", Lang.bind(this,
            function() {
                this._window.destroy();
            }));
         this.add_action(quitAction);
    },

    _loadSettings: function()
    {
        let result = GLib.file_get_contents("settings.json");

        if (result[0] == true)
        {
            this.settings = JSON.parse(String(result[1]));
        }
    },

    _saveSettings: function()
    {
        let result = GLib.file_set_contents("settings.json", JSON.stringify(this.settings));
    },
    
    _getCustomCss: function()
    {
        let result = GLib.file_get_contents("../data/style.css");
        return String(result[1]);
    },

    _webView_onLoadStatus: function(webView, userData)
    {
        // is the document ready?
        if (webView.load_status == 3)
        {
            // create a style element
            let styleElement = webView.get_dom_document().create_element("style");

            // add css styles
            styleElement.set_inner_text(this._getCustomCss());

            // add styles to document
            webView.get_dom_document().head.append_child(styleElement);
        }
    },

    _onStartup: function()
    {
        this._initMenus();
        this._initializeWindow();
        this.showNotes();
    },

    _onActivate: function()
    {
        this._window.present();
    },

    _window_onDestroy: function()
    {
        this._saveSettings();
    },

    _window_onConfigureEvent: function(widget, event)
    {
        let size = this._window.get_size();
        let position = this._window.get_position();
        log("Resized: " + size);
        log("Moved: " + position);

        this.settings.windowSize[0] = Number(size[0]);
        this.settings.windowSize[1] = Number(size[1]);
        this.settings.windowPosition[0] = Number(position[0]);
        this.settings.windowPosition[1] = Number(position[1]);
    },

    _window_onWindowStateEvent: function(widget, event)
    {
        let state = this._window.get_state();

        if (state & Gdk.WindowState.FULLSCREEN)
            return;

        this.settings.windowMaximized = Boolean(state & Gdk.WindowState.MAXIMIZED);
    },

    _searchEntry_onFocusIn: function(widget, event, userData)
    {
        if (widget.text != "")
            return;

        let easeInOutCirc = function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            t -= 2;
            return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
        }

        for (let i = 0; i < 256; i++)
        {
            this._searchEntry.width_request = easeInOutCirc(i, 192, i, 384);
            Gtk.main_iteration();
        }
    },

    _searchEntry_onFocusOut: function(widget, event, userData)
    {
        if (widget.text != "")
            return;

        let easeInOutCirc = function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            t -= 2;
            return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
        }

        for (let i = 256; i >= 0; i--)
        {
            this._searchEntry.width_request = easeInOutCirc(i, 192, i, 384);
            Gtk.main_iteration();
        }
    },

    _searchEntry_onKeyPress: function(widget, event, userData)
    {
        let keyval = event.get_keyval()[1];

        if (keyval == Gdk.KEY_Escape)
        {
            return true;
        }

        else if (keyval == Gdk.KEY_Return)
        {
            this.execSearch();
            return true;
        }
        return false;
    }
});
