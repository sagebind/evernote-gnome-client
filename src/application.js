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
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const AccountSettings = imports.accountSettings;
const MainWindow = imports.mainWindow;
const Settings = imports.settings;


const Application = new Lang.Class({
    Name: "Application",
    Extends: Gtk.Application,

    _init: function()
    {
        Gettext.textdomain('evernote-gnome-client');
        GLib.set_prgname('evernote-gnome-client');
        GLib.set_application_name("Evernote");

        this.parent({
            application_id: "com.stephencoakley.evernote-gnome-client",
            flags: Gio.ApplicationFlags.FLAGS_NONE
        });

        // load settings
        //this._loadSettings();
        this.settings = new Settings.Settings("com.stephencoakley.evernote-gnome-client");

        //this.connect("startup", Lang.bind(this, this._onStartup));
        //this.connect("activate", Lang.bind(this, this._onActivate));
    },

    showAccountSettings: function()
    {
        let accountWindow = new AccountSettings.AccountSettingsWindow(this);
        accountWindow.show_all();
    },

    showAbout: function()
    {
        let aboutDialog = new Gtk.AboutDialog();

        aboutDialog.authors = ["Stephen Coakley <me@stephencoakley.com>"];
        aboutDialog.program_name = "Evernote Gnome Client";
        aboutDialog.comments = "A client for Evernote Web that integrates nicely with GNOME.";
        aboutDialog.copyright = "Created by Stephen Coakley. Evernote Copyright " + String.fromCharCode(0x00A9) + " 2014 Evernote Corporation. All rights reserved.";
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

    showHelp: function()
    {
        GLib.spawn_command_line_async("xdg-open https://evernote.com/contact/support?from=evernote");
    },

    quit: function()
    {
        this._mainWindow.destroy();
    },

    _initMenus: function()
    {
        let menu = new Gio.Menu();
        menu.append("Account", "app.account");
        menu.append("Help", "app.help");
        menu.append("About", "app.about");
        menu.append("Quit","app.quit");
        this.set_app_menu(menu);

        let accountSettingsAction = new Gio.SimpleAction({ name: "account" });
        accountSettingsAction.connect("activate", Lang.bind(this, this.showAccountSettings));
        this.add_action(accountSettingsAction);

        let aboutAction = new Gio.SimpleAction({ name: "help" });
        aboutAction.connect("activate", Lang.bind(this, this.showHelp));
        this.add_action(aboutAction);

        let aboutAction = new Gio.SimpleAction({ name: "about" });
        aboutAction.connect("activate", Lang.bind(this, this.showAbout));
        this.add_action(aboutAction);

        let quitAction = new Gio.SimpleAction({ name: "quit" });
        quitAction.connect("activate", Lang.bind(this, this.quit));
        this.add_action(quitAction);
    },

    _createWindow: function()
    {
        this._mainWindow = new MainWindow.MainWindow(this);
    },

    vfunc_startup: function()
    {
        this.parent();
        this._initMenus();

        // create main window
        if (!this._mainWindow)
            this._createWindow();
        //this._mainWindow = new MainWindow.MainWindow(this);

        this.styles = new Gtk.CssProvider();
        this.styles.load_from_path("../data/application.css");

        let context = new Gtk.StyleContext();
        context.add_provider_for_screen(this._mainWindow.get_screen(), this.styles, Gtk.STYLE_PROVIDER_PRIORITY_USER);

        // show window
        this._mainWindow.show_all();

        // quit when main window is closed
        this._mainWindow.connect("destroy", Lang.bind(this, this.quit));
    },

    vfunc_activate: function()
    {
        this._mainWindow.present();
        this._mainWindow.show_all();
    }
});
