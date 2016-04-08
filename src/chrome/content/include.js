// only create main object once
if (!Zotero.BatchEditing) {
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                           .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader.loadSubScript("chrome://batchediting/content/batchediting.js");
}
