Zotero.ZoTags = {
    // services
    ps: Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService),


    openBatchEditingDialog: function() {
        window.openDialog("chrome://zotags/content/batchediting.xul",
                          "",
                          "chrome,centerscreen,resizable");
    },
};
