// only create main object once
if (!Zotero.ZoTags) {
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                           .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader.loadSubScript("chrome://zotags/content/zotags.js");
}

window.addEventListener("load", function() { Zotero.ZoTags.init(); });
