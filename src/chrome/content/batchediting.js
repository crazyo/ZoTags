var ZoTags_Main = new function() {
    // public methods
    this.init = init;
    this.selectItems = selectItems;
    this.updateTagsPool = updateTagsPool;

    this.mergeTags = mergeTags;
    this.deleteTags = deleteTags;
    this.addNewTag = addNewTag;

    // private methods/properties
    this._ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                         .getService(Components.interfaces.nsIPromptService);
    this._librarySelections = [];
    this._selectedItemIDs = [];


    function init() {

        // init filters

        var libraryList = document.getElementById("library-list");
        var groups = Zotero.Groups.getAll();
        var library;

        // add my library
        library = document.createElement("menuitem");
        library.setAttribute("label", "My Library");
        libraryList.appendChild(library);
        // use 0 as the special library id for My Library
        this._librarySelections.push(0);

        // add group libraries
        for (var i = 0; i < groups.length; i++) {
            library = document.createElement("menuitem");
            library.setAttribute("label", groups[i].name);
            libraryList.appendChild(library);
            this._librarySelections.push(groups[i].libraryID);
        }

        // select the first library by default
        if (this._librarySelections) {
            document.getElementById("library-list-menu").selectedIndex = 0;
        }
        // update tags pool
        this.updateTagsPool();

        // init button statuses

        // apply-selected and add-new-tag are not activated initially
        //   since no items are selected yet
        document.getElementById("apply-selected").disabled = true;
        document.getElementById("add-new-tag").disabled = true;
    }

    function selectItems() {
        // select items
        var io = {};
        window.openDialog("chrome://zotero/content/selectItemsDialog.xul", "", "chrome,modal", io);
        // do nothing if user hit cancel or didn't select any item
        if (!io.dataOut || !io.dataOut.length) {
            return;
        }
        var items = Zotero.Items.get(io.dataOut);

        // selected items must not be attachments
        for (var i = 0; i < items.length; i++) {
            if (items[i].isAttachment()) {
                this._ps.alert(null, "Attachments Selected", "Attachments do NOT have tags!");
                return;
            }
        }

        this._selectedItemIDs = io.dataOut;

        // clear items pool
        var pool = document.getElementById("items-pool");
        while (pool.firstChild) {
            pool.removeChild(pool.firstChild);
        }
        // refill items pool
        for (var i = 0; i < items.length; i++) {
            var row = document.createElement("listitem");
            row.setAttribute("label", items[i].getDisplayTitle());
            pool.appendChild(row);
        }

        // lock and set library selection
        var libmenu = document.getElementById("library-list-menu");
        libmenu.setAttribute("disabled", true);
        // all selected items must belong to the same library
        var libraryid = items[0].libraryID;
        libmenu.selectedIndex = !libraryid ? 0 : this._librarySelections.indexOf(libraryid);

        // enable apply-selected and add-new-tag
        document.getElementById("apply-selected").disabled = false;
        document.getElementById("add-new-tag").disabled = false;
    }

    function updateTagsPool() {
        // retrieve filter info
        var selectedLibraryID = ZoTags_Main._librarySelections[document.getElementById("library-list-menu").selectedIndex];
        var inputName = document.getElementById("search-by-tagname").value;
        var selectedItemIDs = this._selectedItemIDs;

        // retrieve filtered tags
        var tags = _retrieveTags(selectedLibraryID, inputName, selectedItemIDs);

        // clear tags pool
        var pool = document.getElementById("tags-pool");
        while (pool.firstChild) {
            pool.removeChild(pool.firstChild);
        }
        // refill tags pool
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            var row = document.createElement("listitem");
            row.setAttribute("type", "checkbox");
            row.setAttribute("label", tag.name);
            row.setAttribute("value", tag.tagID);
            document.getElementById("tags-pool").appendChild(row);
        }
    }


    function mergeTags() {
        // confirm
        if (!this._ps.confirm(null,
                              "Are You Sure?",
                              "You cannot undo the merge. Are you sure you wish to proceed?")) {
            return;
        }

        // get all tags selected
        var tagids = [];
        var pool = document.getElementById("tags-pool").children;
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].checked) {
                tagids.push(pool[i].value);
            }
        }
        if (!tagids.length) {
            this._ps.alert(null, null, "No Tag Selected!");
            return;
        }

        // get name for the new tag
        var tags = [];
        for (var i = 0; i < tagids.length; i++) {
            tags.push(Zotero.Tags.getName(tagids[i]));
        }
        var io = {tags: tags};
        window.openDialog("chrome://zotags/content/inputMergedTagName.xul",
                          "",
                          "chrome,centerscreen,modal,resizable",
                          io);
        var newTagName = io.out;
        if (!newTagName) return;

        // decide whether it is a global change
        var all = document.getElementById("apply-global").selected;

        // get all the affected items
        var items = [];
        if (all) {
            // get all the items assigned with these tags
            for (var i = 0; i < tagids.length; i++) {
                var _items = Zotero.Tags.get(tagids[i]).getLinkedItems();
                for (var j = 0; j < _items.length; j++) {
                    if (items.indexOf(_items[j]) === -1) {
                        items.push(_items[j]);
                    }
                }
            }
        }
        else {
            // selected items
            items = Zotero.Items.get(this._selectedItemIDs);
        }

        // add the new tag to items
        for (var i = 0; i < items.length; i++) {
            items[i].addTag(newTagName);
        }

        // delete old tags
        // filter out the tag that is actually the new tag
        for (var i = 0; i < tagids.length; i++) {
            if (Zotero.Tags.getName(tagids[i]) === newTagName) {
                tagids.splice(i, 1);
                break;
            }
        }
        _deleteTags(tagids, all ? null : this._selectedItemIDs);

        // update tags pool
        updateTagsPool();
    }

    function deleteTags() {
        // confirm
        if (!this._ps.confirm(null,
                              "Are You Sure?",
                              "You cannot undo the deletion. Are you sure you wish to proceed?")) {
            return;
        }

        // get all tags selected
        var tagids = [];
        var pool = document.getElementById("tags-pool").children;
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].checked) {
                tagids.push(pool[i].value);
            }
        }
        if (!tagids.length) {
            this._ps.alert(null, null, "No Tag Selected!");
            return;
        }

        // decide whether it is a global change
        var all = document.getElementById("apply-global").selected;

        // do the actual job
        _deleteTags(tagids, all ? null : this._selectedItemIDs);

        // update tags pool
        updateTagsPool();
    }

    function addNewTag() {
        // get name for the new tag
        var io = {};
        window.openDialog("chrome://zotags/content/inputNewTagName.xul",
                          "",
                          "chrome,centerscreen,modal,resizable",
                          io);
        var name = io.out;
        if (!name) return;

        // add the new tag to selected items
        var items = Zotero.Items.get(this._selectedItemIDs);
        for (var i = 0; i < items.length; i++) {
            items[i].addTag(name);
        }

        // update tags pool
        updateTagsPool();
    }
};


function _retrieveTags(libraryid, namepart, itemids) {
    // base sql
    var sql = "SELECT tagID, name FROM tags";
    var params = [];

    // library
    sql += " WHERE libraryID";
    if (libraryid) {
        sql += "=?";
        params.push(libraryid);
    }
    else {
        sql += " IS NULL";
    }

    // partial name
    if (namepart) {
        sql += " AND name LIKE ?";
        params.push("%" + namepart + "%");
    }

    // item ids
    if (itemids && itemids.length) {
        sql += " AND tagID IN (SELECT tagID FROM itemTags WHERE itemID IN (" + itemids.join() + "))";
    }

    var tags = params.length > 0 ? Zotero.DB.query(sql, params) : Zotero.DB.query(sql);
    return tags;
}

function _deleteTags(tagids, itemids) {
    // if no itemids specified: delete these tags
    //                    else: remove these tags from the items
    if (!itemids) {
        Zotero.Tags.erase(tagids);
    }
    else {
        var items = Zotero.Items.get(itemids);
        for (var i = 0; i < items.length; i++) {
            for (var j = 0; j < tagids.length; j++) {
                if (items[i].hasTag(tagids[j])) items[i].removeTag(tagids[j]);
            }
        }
    }

    Zotero.Tags.purge();
}
