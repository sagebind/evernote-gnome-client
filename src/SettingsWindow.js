const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const WebFrame = imports.WebFrame;


const SettingsWindow = new Lang.Class({
    Name: "SettingsWindow",
    Extends: Gtk.Window,

    _init: function(application)
    {
        this.parent({
            application: application
        });

        // create a web frame
        this._webFrame = new WebFrame.WebFrame();
        this.add(this._webFrame.widget);

        // add custom css
        this._webFrame.stylesheets.push("../data/settings.css");

        // load main evernote interface
        this._webFrame.navigate("https://www.evernote.com/Settings.action");
    }
});
