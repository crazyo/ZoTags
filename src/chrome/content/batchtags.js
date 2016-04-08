var BatchTags = new function() {
    this.init = init;
    this.initAdd = initAdd;

    // Queries to execute on accept.
    this.query = [];

    function init (){
        var group = document.getElementById("tag-batch");
        var tagnames = [];
        var tags = Zotero.Tags.getAll();

        for (var item in tags) {
            if (!tags.hasOwnProperty(item)) {
                continue;
            }
            tagnames.push(tags[item].name);
        }

        for (var i = 0; i < tagnames.length; i++) {
            var tagbox = document.createElement("checkbox");
            tagbox.setAttribute("id", tagnames[i]);
            tagbox.setAttribute("label", tagnames[i]);
            group.appendChild(tagbox);
        }

    }

    function initAdd(){
        var group = document.getElementById("batch-add-tag-dropdown");
        var tagnames = [];
        var tags = Zotero.Tags.getAll();

        for (var item in tags) {
            if (!tags.hasOwnProperty(item)) {
                continue;
            }
            tagnames.push(tags[item].name);
        }

        for (var i = 0; i < tagnames.length; i++) {
            var item = document.createElement("menuitem");
            item.setAttribute("id", tagnames[i]);
            item.setAttribute("label", tagnames[i]);
            item.setAttribute("oncommand", "BatchTags.updateNewNameField(this);");

            group.appendChild(item);
        }
    }

    this.updateNewNameField = function(item){
        document.getElementById("add-tag-new-name").value = item.label;
    }

    this.renameTags = function (){
        var group = document.getElementById("tag-batch");
        var tags = this.getCheckedBoxes("tag-batch");
        var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Components.interfaces.nsIPromptService);

        // Case of Renaming
        var newLabel = document.getElementById("input-new-name").value;

        if (newLabel == ""){
            ps.warning("");
        }

        var toModify = document.getElementById(tags[0].id);

        this.query.push("this.renameTag(\"" + tags[0].label + "\", \"" + newLabel + "\")");
        toModify.label = newLabel;
        toModify.id = newLabel;

        // Case of Merging
        if (tags.length > 1){
            for (i = 1; i < tags.length; i++){
                var toDelete = document.getElementById(tags[i].id);
                this.query.push("this.renameTag(\"" + tags[i].label + "\", \"" + newLabel + "\")");
                toDelete.parentNode.removeChild(toDelete);
            }
        }

        // Set the input box back to hidden.
        document.getElementById("for-new-name").setAttribute("hidden","true");
    }

    this.enableSave = function(){
        if (document.getElementById("input-new-name").value.length){
            document.getElementById("save-new-name").disabled = false;
        } else{
            document.getElementById("save-new-name").disabled = true;
        }
    }

    this.toggleRenameFields = function(){
        var tags = this.getCheckedBoxes("tag-batch");
        var group = document.getElementById("tag-batch");

        // Disable Delete button & Tags if we are doing renaming.
        if (tags.length){
            if (document.getElementById("for-new-name").getAttribute("hidden") == "true"){
                document.getElementById("delete-tag").disabled = true;
                document.getElementById("for-new-name").setAttribute("hidden","false");

                for (i=0; i<group.children.length; i++){
                    group.children[i].disabled = true;
                }
            } else{
                document.getElementById("delete-tag").disabled = false;
                document.getElementById("for-new-name").setAttribute("hidden","true");

                for (i=0; i<group.children.length; i++){
                    group.children[i].disabled = false;
                }
            }
        }
    }

    this.cancelRename = function(){

        console.log("aaaaa");
        document.getElementById("input-new-name").value = "";
        this.toggleRenameFields();
    }

    this.deleteTags = function (){
        var group = document.getElementById("tag-batch");
        var tags = this.getCheckedBoxes("tag-batch");

        if (tags.length > 0){
            for(i = 0; i < tags.length; i++){
                var toDelete = document.getElementById(tags[i].id);
                this.query.push("this.deleteTag(\"" + tags[i].label + "\")");
                toDelete.parentNode.removeChild(toDelete);
            }
        }
    }

    this.acceptChanges = function(){
        return this.query;
    }

    this.acceptNewName = function(){
        return document.getElementById("add-tag-new-name").value;
    }

    this.getCheckedBoxes = function(chkboxName) {
      var checkboxes = document.getElementById(chkboxName);
      var checkboxesChecked = [];

      // loop over them all
      for (i=0; i<checkboxes.children.length; i++) {
         // And stick the checked ones onto an array...
         if (checkboxes.children[i].checked) {
            checkboxesChecked.push(checkboxes.children[i]);
         }
      }
      // Return the array if it is non-empty, or null
      return checkboxesChecked;
    }
};
