#!/usr/bin/gjs

imports.searchPath.unshift('.');
const EvernoteGClient = imports.Application;

let app = new EvernoteGClient.EvernoteGClient();
app.run(ARGV);
