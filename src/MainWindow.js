const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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

        // add custom css
        this._webFrame.stylesheets.push("../data/main-window.css");

        // load main evernote interface
        this._webFrame.navigate("https://www.evernote.com/Home.action");
    },

    newNote: function()
    {
        this._webFrame._webView.execute_script("document.getElementById('gwt-debug-newNoteButton').click()");
    },

    execSearch: function()
    {
        // get the search query text
        let query = this._searchEntry.text;

        // clear internal search box
        this._webFrame._webView.execute_script("document.getElementsByClassName('GM2YP5TCDQ')[0].click();");

        // populate search box with query
        this._webFrame._webView.execute_script("document.getElementsByClassName('GM2YP5TCCCC')[0].value='" + query + "';");

        // execute search
        this._webFrame._webView.execute_script("document.getElementById('gwt-debug-searchSubmit').click()");
    },

    _onConfigureEvent: function(widget, event)
    {
        let size = this.get_size();
        let position = this.get_position();
        log("Resized: " + size);
        log("Moved: " + position);

        this.application.settings.windowSize[0] = Number(size[0]);
        this.application.settings.windowSize[1] = Number(size[1]);
        this.application.settings.windowPosition[0] = Number(position[0]);
        this.application.settings.windowPosition[1] = Number(position[1]);
    },

    _onWindowStateEvent: function(widget, event)
    {
        let state = this.get_state();

        if (state & Gdk.WindowState.FULLSCREEN)
            return;

        this.application.settings.windowMaximized = Boolean(state & Gdk.WindowState.MAXIMIZED);
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
