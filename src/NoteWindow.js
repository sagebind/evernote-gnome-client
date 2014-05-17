const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const WebFrame = imports.WebFrame;


const NoteWindow = new Lang.Class({
    Name: "NoteWindow",
    Extends: Gtk.Window,

    _init: function(application, uri)
    {
        this.parent({
            application: application
        });

        this._headerBar = new Gtk.HeaderBar();
        this._headerBar.title = "Evernote";
        this._headerBar.show_close_button = true;
        this.set_titlebar(this._headerBar);

        this._newNoteButton = new Gtk.Button({label: "New Note"});
        this._newNoteButton.connect("clicked", Lang.bind(this, this.newNote));
        this._headerBar.pack_start(this._newNoteButton);

        this._nextNoteButton = new Gtk.Button({label: ">"});
        this._nextNoteButton.connect("clicked", Lang.bind(this, this.nextNote));
        this._headerBar.pack_end(this._nextNoteButton);

        this._prevNoteButton = new Gtk.Button({label: "<"});
        this._prevNoteButton.connect("clicked", Lang.bind(this, this.previousNote));
        this._headerBar.pack_end(this._prevNoteButton);

        // create a web frame
        this._webFrame = new WebFrame.WebFrame();
        this._webFrame.connect("document-loaded", Lang.bind(this, this._onDocumentLoaded));

        // add custom css
        this._webFrame.stylesheets.push("../data/note.css");

        this.add(this._webFrame.widget);

        this.set_default_size(800, 640);
    },

    newNote: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        document.query_selector("#gwt-debug-newNoteButton").click();
    },

    nextNote: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        document.query_selector("#gwt-debug-nav .nextNoteIcon").click();
    },

    previousNote: function()
    {
        let document = this._webFrame._webView.get_dom_document();
        document.query_selector("#gwt-debug-nav .previousNoteIcon").click();
    },

    _onDocumentLoaded: function()
    {
        let document = this._webFrame._webView.get_dom_document();

        let noteTitle = document.query_selector("#gwt-debug-noteTitle");
        if (noteTitle)
            this._headerBar.title = noteTitle.innerText;

        let noteCount = document.query_selector("#gwt-debug-nav span");
        if (noteCount)
            this._headerBar.subtitle = noteCount.innerText;
    }
});
