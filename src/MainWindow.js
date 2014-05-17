const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const NoteWindow = imports.NoteWindow;
const WebFrame = imports.WebFrame;


const MainWindow = new Lang.Class({
    Name: "MainWindow",
    Extends: Gtk.ApplicationWindow,

    _init: function(application)
    {
        this.parent({
            application: application,
            title: "Evernote",
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
        this._searchEntry.width_request = 192;
        this._searchEntry.connect("focus-in-event", Lang.bind(this, this._searchEntry_onFocusIn));
        this._searchEntry.connect("focus-out-event", Lang.bind(this, this._searchEntry_onFocusOut));
        this._searchEntry.connect("key-press-event", Lang.bind(this, this._searchEntry_onKeyPress));
        this._headerBar.pack_end(this._searchEntry);

        // create a web frame
        this._webFrame = new WebFrame.WebFrame();
        this.add(this._webFrame.widget);

        // listen for popup requests
        this._webFrame._webView.connect("navigation-policy-decision-requested", Lang.bind(this, this._webView_onNavigationRequested));
        this._webFrame._webView.connect("new-window-policy-decision-requested", Lang.bind(this, this._webView_onNewWindowRequested));
        this._webFrame._webView.connect("create-web-view", Lang.bind(this, this._webView_onCreateWebView));
        this._webFrame.connect("document-loaded", Lang.bind(this, this._webView_onDocumentLoaded));

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

    execSearch: function()
    {
        // get the search query text
        let query = this._searchEntry.text;

        let document = this._webFrame._webView.get_dom_document();

        // clear internal search box
        document.query_selector("img[width='16']").click();

        // populate search box with query
        document.query_selector("#gwt-debug-searchBox input").value = query;

        // execute search
        document.query_selector("#gwt-debug-searchSubmit").click();
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
        log("Internal navigation requested: " + request.uri);
    },

    _webView_onNewWindowRequested: function(webView, frame, request, navigationAction, policyDecision, userData)
    {
        log("Opening external link: " + request.uri);

        // open url in default browser
        GLib.spawn_command_line_async("xdg-open " + request.uri);

        policyDecision.ignore();
        return true;
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
        if (noteTitle)
            this._headerBar.subtitle = noteTitle.innerText;
    },

    _searchEntry_onFocusIn: function(widget, event, userData)
    {
        if (widget.text != "")
            return;

        let easeInOutCirc = function (t, b, c, d)
        {
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

        let easeInOutCirc = function (t, b, c, d)
        {
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
