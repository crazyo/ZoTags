var ZotBatch_Main = new function() {
    // public methods
    this.init = init;
    this.selectItems = selectItems;
    this.updateTagsPool = updateTagsPool;

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
        var selectedLibraryID = ZotBatch_Main._librarySelections[document.getElementById("library-list-menu").selectedIndex];
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
        for (var tagid in tags) {
            if (!tags.hasOwnProperty(tagid)) {
                continue;
            }
            var tag = tags[tagid];
            var row = document.createElement("listitem");
            row.setAttribute("type", "checkbox");
            row.setAttribute("label", tag.name);
            row.setAttribute("value", tagid);
            document.getElementById("tags-pool").appendChild(row);
        }
    }

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
};
