/*
  SetArialRegular36.jsx
  --------------------------------------------------------------
  Sets all EDITABLE text (point text & area/paragraph text) to:
      Font:  Arial, Regular (not Narrow/Condensed/Bold/Italic)
      Size:  36 pt

  Behavior:
  - If one or more objects are selected, only the text frames
    within that selection are changed (including text frames
    nested inside selected groups).
  - If nothing is selected, EVERY text frame in the active
    document is changed.

  Run: File > Scripts > Other Script...  (or place in the
  Illustrator Scripts folder and run from File > Scripts)
*/

(function () {

    if (app.documents.length === 0) {
        alert("No document is open.");
        return;
    }

    var doc = app.activeDocument;

    // ---------------------------------------------------------
    // 1. Locate a proper "Arial Regular" TextFont on the system.
    //    Illustrator identifies fonts by internal PostScript name,
    //    so we try the common Arial-Regular names first, then
    //    fall back to scanning app.textFonts for family "Arial"
    //    with style "Regular" (skipping Narrow/Condensed/Bold/etc).
    // ---------------------------------------------------------
    function findArialRegular() {
        var directNames = ["ArialMT", "Arial-Regular", "Arial"];
        var i;

        for (i = 0; i < directNames.length; i++) {
            try {
                var f = app.textFonts.getByName(directNames[i]);
                if (f) return f;
            } catch (e) {
                // not found under that name, keep trying
            }
        }

        // Fallback: scan all installed fonts for an exact Arial/Regular match
        for (i = 0; i < app.textFonts.length; i++) {
            var tf = app.textFonts[i];
            var family = tf.family ? tf.family.toString() : "";
            var style = tf.style ? tf.style.toString() : "";

            if (family === "Arial" && /^regular$/i.test(style)) {
                return tf;
            }
        }

        return null;
    }

    var arialRegular = findArialRegular();

    if (!arialRegular) {
        alert("Could not find 'Arial Regular' installed on this system.\n" +
              "Please make sure Arial (Regular style) is installed and try again.");
        return;
    }

    // ---------------------------------------------------------
    // 2. Collect target text frames.
    //    - If something is selected: gather TextFrames from the
    //      selection, recursing into groups/compound selections.
    //    - If nothing is selected: use every text frame in the doc.
    // ---------------------------------------------------------
    function collectTextFramesFromItem(item, bucket) {
        if (item.typename === "TextFrame") {
            bucket.push(item);
        } else if (item.typename === "GroupItem") {
            for (var i = 0; i < item.pageItems.length; i++) {
                collectTextFramesFromItem(item.pageItems[i], bucket);
            }
        }
        // other item types (paths, images, etc.) are ignored
    }

    var targetFrames = [];

    if (app.selection && app.selection.length > 0) {
        for (var s = 0; s < app.selection.length; s++) {
            collectTextFramesFromItem(app.selection[s], targetFrames);
        }
    }

    if (targetFrames.length === 0) {
        // Nothing selected (or selection contained no text) -> whole document
        for (var t = 0; t < doc.textFrames.length; t++) {
            targetFrames.push(doc.textFrames[t]);
        }
    }

    if (targetFrames.length === 0) {
        alert("No editable text frames were found.");
        return;
    }

    // ---------------------------------------------------------
    // 3. Apply Arial Regular / 36pt to every character run.
    // ---------------------------------------------------------
    var changedCount = 0;

    for (var g = 0; g < targetFrames.length; g++) {
        var frame = targetFrames[g];

        try {
            var range = frame.textRange; // all characters in this text frame
            range.characterAttributes.textFont = arialRegular;
            range.characterAttributes.size = 36;
            changedCount++;
        } catch (err) {
            // Skip frames that error out (e.g. locked/linked text) but keep going
            $.writeln("Skipped a text frame: " + err);
        }
    }

    alert("Done. Updated " + changedCount + " text frame(s) to Arial Regular, 36pt.");

})();
