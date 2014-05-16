#!/usr/bin/gjs

imports.searchPath.unshift('.');
const Application = imports.Application;

let app = new Application.Application();
app.run(ARGV);
