// interested elements
var _pool, _input, _acceptButton;
// io
var _io;

function init() {
    // assign global variables
    _pool = document.getElementById("merged-tagname-pool");
    _input = document.getElementById("merged-tagname-input");
    _acceptButton = document.documentElement.getButton('accept');
    _io = window.arguments[0];

    // fill in tag name candidates
    var tags = _io.tags;
    for (var i = 0; i < tags.length; i++) {
        var element = document.createElement("radio");
        element.setAttribute("label", tags[i]);
        _pool.appendChild(element);
    }

    // disable/enable buttons
    _acceptButton.disabled = true;
    // when an old tag name is selected, empty tagname-input box and enable accept button
    _pool.addEventListener("select", function() {
        // make sure the select event is not fired by "null"
        if (this.selectedItem) {
            _input.value = "";
            _acceptButton.disabled = false;
        }
    });
    // when a new name is entered, deselect all radio buttons and enable accept button
    _input.addEventListener("input", function() {
        _pool.selectedItem = null;
        _acceptButton.disabled = this.value ? false : true;
    });
}

function accept() {
    if (_pool.selectedItem) {
        _io.out = _pool.selectedItem.label;
    }
    else {
        _io.out = _input.value;
    }
}
