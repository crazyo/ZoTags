Zotero.ZotBatch = {
    // services
    ps: Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService),


    init: function() {
        document.getElementById("zotero-tag-selector").style.MozBinding = "url('chrome://zotbatch/content/batchediting.xml#tags-batch-editing')";
    },

    openBatchEditingDialog: function() {
        window.openDialog("chrome://zotbatch/content/batchediting.xul",
                          "",
                          "chrome,centerscreen,resizable=no");
    },
};

window.addEventListener("load", function() { Zotero.ZotBatch.init(); });
