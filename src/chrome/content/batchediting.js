Zotero.BatchEditing = {
    ps: Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                .getService(Components.interfaces.nsIPromptService),

    init: function() {
        // var ZoteroPane = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser").ZoteroPane;
        // var tagmenu = document.getElementById("view-settings-popup");
        // var batchedit = document.createElement("menuitem");

        // batchedit.setAttribute("label", "Batch Edit Tags");
        // batchedit.setAttribute("oncommand", "Zotero.BatchEditing.openDialog();");
        // tagmenu.appendChild(batchedit);
        var observerID = Zotero.Notifier.registerObserver(this.observer, ["item"]);

        window.addEventListener("unload", function() {
            Zotero.Notifier.unregisterObserver(observerID);
        });
    },

    openAddTagDialog: function(){
        var selectedItems = ZoteroPane_Local.getSelectedItems();
        window.openDialog("chrome://batchediting/content/addtags.xul",
            "",
            "chrome,centerscreen,resizable=yes",
            selectedItems);
    },

    openDialog: function(){
        window.openDialog("chrome://batchediting/content/batchtags.xul",
            "",
            "chrome,centerscreen,resizable=yes");
    },

    test: function(){
        var ret = this.ps.confirm(null, "Confirm", "Confirmtest to make changes?");
        window.alert(ret);
    },

    acceptChanges: function(listOfActions){
        if (this.ps.confirm(null, "Confirm", "Confirm to make changes?")){
            for (i=0;i < listOfActions.length; i++){

                // Execute queries.
                eval(listOfActions[i]);
            };
        };
    },


    //Zotero.Tags endpoint
    renameTag: function(tagName, newTagName){
        var tagID = this.getTagIDFromName(tagName);
        Zotero.Tags.rename(tagID, newTagName);
    },

    deleteTag: function(tagName){
        var tagID = this.getTagIDFromName(tagName);
        Zotero.Tags.erase(tagID);
    },

    addTags: function(tagName){
        if (this.ps.confirm(null, "Confirm", "Confirm to add tag?")){
            var items = ZoteroPane_Local.getSelectedItems();

            console.log(items);

            if(!tagName){
                this.ps.alert(null, "warning", "Tag Name can't be empty. No change will be made.")
            } else{

                var tagID = this.getTagIDFromName(tagName);

                //Check if tag of given name exists.
                if (tagID){

                    // Database access point.
                    Zotero.DB.beginTransaction();
                    tag = Zotero.Tags.get(tagID);
                    //console.log(tag);

                    for (i=0; i<items.length; i++){
                        tag.addItem(items[i].getID());
                        tag.save();
                    }

                    Zotero.DB.commitTransaction();



                // tagName doesnt exist. 
                // TODO: impletement this feature.
                } else{
                    console.log("doesnt");
                }
            }
        }

    },

    toggleAddTag: function(){

        console.log("inaaa");
        if (ZoteroPane_Local.getSelectedItems().length != 0){
            document.getElementById("add-tags-menuitem").disabled = false;
        } else{
            document.getElementById("add-tags-menuitem").disabled = true;
        }
    },

    getTagIDFromName: function(tagName){
        var prepared = "SELECT tagID FROM tags WHERE name=?";
        var param = [tagName];
        return Zotero.DB.valueQuery(prepared, param);
    }
};

window.addEventListener("load", function() {Zotero.BatchEditing.init();});
