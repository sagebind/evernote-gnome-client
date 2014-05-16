const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const MainWindow = imports.MainWindow;
const SettingsWindow = imports.SettingsWindow;


const Application = new Lang.Class({
    Name: "EvernoteGClient",
    Extends: Gtk.Application,

    _init: function()
    {
        Gettext.textdomain('evernote-gnome-client');
        GLib.set_prgname('evernote-gnome-client');
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

    showSettings: function()
    {
        let settingsWindow = new SettingsWindow.SettingsWindow(this);
        settingsWindow.show_all();
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
        aboutDialog.transient_for = this._mainWindow;

        aboutDialog.show();
        aboutDialog.connect("response", function() {
            aboutDialog.destroy();
        });
    },

    quit: function()
    {
        this._mainWindow.destroy();
        this._saveSettings();
    },

    _initMenus: function()
    {
        let menu = new Gio.Menu();
        menu.append("Settings", "app.settings");
        menu.append("About", "app.about");
        menu.append("Quit","app.quit");
        this.set_app_menu(menu);

        let settingsAction = new Gio.SimpleAction ({ name: "settings" });
        settingsAction.connect("activate", Lang.bind(this, this.showSettings));
        this.add_action(settingsAction);

        let aboutAction = new Gio.SimpleAction ({ name: "about" });
        aboutAction.connect("activate", Lang.bind(this, this.showAbout));
        this.add_action(aboutAction);

        let quitAction = new Gio.SimpleAction ({ name: "quit" });
        quitAction.connect("activate", Lang.bind(this, this.quit));
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

    _onStartup: function()
    {
        this._initMenus();

        // create main window
        this._mainWindow = new MainWindow.MainWindow(this);

        // show window
        this._mainWindow.show_all();

        // quit when main window is closed
        this._mainWindow.connect("destroy", Lang.bind(this, this.quit));
    },

    _onActivate: function()
    {
        this._mainWindow.present();
    }
});
