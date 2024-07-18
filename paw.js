// document.addEventListener('keydown', async function(e) {
//     if (e.key === "s") {
//         console.log("hello world");
//         console.log("'s' key was pressed");
//         send_to_paw();
//     }
// });
console.log("Hello from paw.js");

function paw_annotation_mode() {
    document.addEventListener('mouseup', async function(e) {
        var selection = window.getSelection().toString().trim();
        if (selection.length > 0) { // If some text is selected
            console.log('Selected text: ' + selection);
            send_to_paw();
        }
    }, true);
}

function send_to_paw() {
    var selection = window.getSelection().toString();
    if (selection.length > 0) {
        var url = encodeURIComponent(window.location.href);
        var title = encodeURIComponent(document.title || "[untitled page]");
        var body = encodeURIComponent(selection);
        var range = window.getSelection().getRangeAt(0);
        var parent = range.commonAncestorContainer;
        while (parent.nodeType !== Node.ELEMENT_NODE) {
            parent = parent.parentNode;
        }
        var note = encodeURIComponent(parent.textContent || "");
        location.href = 'org-protocol://paw?template=w&url=' + url + '&title=' + title + '&note=' + note + '&body=' + body;
    }
}

function paw_new_entry() {
    var selection = window.getSelection().toString();
    if (selection.length > 0) {
        var url = window.location.href;
        var title = document.title || "[untitled page]";
        var body = selection;
        var range = window.getSelection().getRangeAt(0);
        var parent = range.commonAncestorContainer;
        while (parent.nodeType !== Node.ELEMENT_NODE) {
            parent = parent.parentNode;
        }
        var note = parent.textContent || "";
        var data = {
            "url": url,
            "title": title,
            "note": note,
            "body": body
        };

        return data;
    } else {
        return "";
    }
}
