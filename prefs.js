'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.next-up');

    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Create a new preferences row
    const row = new Adw.ActionRow({ title: "Panel to show indicator in" });
    group.add(row);

    const dropdown = new Gtk.DropDown({
        model: Gtk.StringList.new(["Left", "Center", "Right"]),
        valign: Gtk.Align.CENTER
    });

    // Create new preferences row 2
    const row2 = new Adw.ActionRow({ title: "Show next events starting" });
    group.add(row2);

    const dropdown2 = new Gtk.DropDown({
        model: Gtk.StringList.new(["Today", "This week", "This month"]),
        valign: Gtk.Align.CENTER
    });

    settings.bind(
        "which-panel",
        dropdown,
        "selected",
        Gio.SettingsBindFlags.DEFAULT
    );

    settings.bind(
        "events-starting",
        dropdown2,
        "selected",
        Gio.SettingsBindFlags.DEFAULT
    );

    row.add_suffix(dropdown);
    row.activatable_widget = dropdown;

    row2.add_suffix(dropdown2);
    row2.activatable_widget = dropdown2;

    // Add our page to the window
    window.add(page);
}