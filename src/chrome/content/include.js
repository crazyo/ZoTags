// only create main object once
if (!Zotero.ZotBatch) {
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                           .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader.loadSubScript("chrome://zotbatch/content/zotbatch.js");
}
