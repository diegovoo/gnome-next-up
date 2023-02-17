/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = "next-up-indicator-extension";

const { GObject, St, Clutter, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Calendar = imports.ui.calendar;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;

const Me = ExtensionUtils.getCurrentExtension();
const DateHelperFunctions = Me.imports.dateHelperFunctions;


const _makeLogFunction(prefix) {
    return msg => {
        GLib._load_structured(
            'next-up',
            Glib.LogLevelFlags.LEVEL_MESSAGE,
            {
                'MESSAGE': msg,
                SYSLOG_IDENTIFIER: 'org.gnome.shell.extensions.next-up',
                CODE_FILE: file,
                CODE_FUNC: `${func}`,
                CODE_LINE: `${line}`
            }
        );
    }
}

const Indicator = GObject.registerClass(class Indicator extends PanelMenu.Button {
        _init() {
            super._init(St.Align.START);
            this._settings = ExtensionUtils.getSettings();
            this._calendarSource = new Calendar.DBusEventSource();

            this._loadGUI();
            this._initialiseMenu();


            this._menuLayout = new St.BoxLayout();

            this._addSettingChangedSignal('which-panel', this._whichPanelChanged.bind(this));
            this._addSettingChangedSignal('events-starting', this._eventsStartingChanged.bind(this));

            this.connect('destroy', this._onButtonDestroy.bind(this));

            this._updateUI(true);
        }

        _whichPanelChanged() {
            this.container.get_parent().remove_actor(this.container);

            let boxes = {
                left: Main.panel._leftBox,
                center: Main.panel._centerBox,
                right: Main.panel._rightBox
            };

            let p = this.positionInPanel;
            let i = this._settings.get_int('panel-box-index');
            boxes[p].insert_child_at_index(this.container, i);
        }

        _eventsStartingChanged() {
            this.container.get_parent().remove_actor(this.container);

            /* changes settings */ 
            let boxes = {
                today: 
                week:
                month:
            };

            let p = this.eventsStarting;
            let i = this._settings.get_int('events-starting-box-index');
            boxes[p].insert_child_at_index(this.container, i);

        _loadGUI() {
            this._menuLayout = new St.BoxLayout({
                vertical: false,
                clip_to_allocation: true,
                x_align: Clutter.ActorAlign.START,
                y_align: Clutter.ActorAlign.CENTER,
                reactive: true,
                x_expand: true,
                pack_start: false
            });


            this._confettiGicon = Gio.icon_new_for_string(Me.path + "/assets/party-popper.png");
            this._alarmIcon = new St.Icon({
                icon_name: 'alarm-symbolic',
                style_class: 'system-status-icon'
            });

            this.icon = this._alarmIcon;


            this.text = new St.Label({
                text: "Loading",
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER
            });


            this._menuLayout.add_actor(this.icon);
            this._menuLayout.add_actor(this.text);
            this.add_actor(this._menuLayout);

            return;
        }


        _initialiseMenu() {
            const settingsItem = new PopupMenu.PopupMenuItem(_('Settings'));
            settingsItem.connect('activate', () => {
                ExtensionUtils.openPrefs();
            });
            this.menu.addMenuItem(settingsItem);
        }


        setText(text) {
            this.text.set_text(text);
        }


        showAlarmIcon() {
            this.icon.set_icon_name("alarm-symbolic");
        }


        showConfettiIcon() {
            this.icon.set_gicon(this._confettiGicon);
        }


        vfunc_event(event) {

            if ((event.type() == Clutter.EventType.TOUCH_END || event.type() == Clutter.EventType.BUTTON_RELEASE)) {

                if (event.get_button() === Clutter.BUTTON_PRIMARY) {

                    // Show calendar on left click
                    if (this.menu.isOpen) {
                        this.menu._getTopMenu().close();
                    }
                    else {
                        Main.panel.toggleCalendar();
                    }

                }
                else {
                    // Show settings menu on right click
                    this.menu.toggle();
                }
            }

            return Clutter.EVENT_PROPAGATE;
        }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();

        this._settings = ExtensionUtils.getSettings();
        this._settingChangedSignal = this._settings.connect("changed::which-panel", () => {
            this.unloadIndicator();
            this.loadIndicator();
        });

/*        this._settingChangedSignal = this._settings.connect("changed::events-starting", () => {
            this.unloadIndicator();
            this.loadIndicator();
        }); */

        // Wait 3 seconds before loading the indicator
        // So that it isn't loaded too early and positioned after other elements in the panel
        this.delaySourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => {
            this.loadIndicator();
            this._startLoop();

            return false;
        });

    }

    _startLoop() {
        this.sourceId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            5,                               // seconds to wait
            () => {
                this.refreshIndicator();

                return GLib.SOURCE_CONTINUE;
            }
        );
    }


    loadIndicator() {

        const boxes = [
            Main.panel._leftBox,
            Main.panel._centerBox,
            Main.panel._rightBox
        ];

        const whichPanel = this._settings.get_int("which-panel");

        boxes[whichPanel].insert_child_at_index(this._indicator.container, 0);

        const boxes2 = [
            Main.panel._todayBox,
            Main.panel._thisWeekBox,
            Main.panel._thisMonthBox
        ];

        const eventsStarting = this._settings.get_int("events-starting");

        boxes2[eventsStarting].insert_child_at_index(this._indicator.container2, 0);

    }


    unloadIndicator() {
        this._indicator.container.get_parent().remove_actor(this._indicator.container);
        this._indicator.container2.get_parent().remove_actor(this._indicator.container2);
    }


    refreshIndicator() {
        const todaysEvents = DateHelperFunctions.getTodaysEvents(this._indicator._calendarSource);
        const eventStatus = DateHelperFunctions.getNextEventsToDisplay(todaysEvents);
        const text = DateHelperFunctions.eventStatusToIndicatorText(eventStatus);


        if ((eventStatus.currentEvent === null) && (eventStatus.nextEvent === null)) { /* === returns false if not the same type */
            this._indicator.showConfettiIcon();
        }
        else {
            this._indicator.showAlarmIcon();
        }


        this._indicator.setText(text);
    }


    disable() {
        Main.panel._centerBox.remove_child(this._indicator.container);


        this._settings.disconnect(this._settingChangedSignal);


        this._indicator.destroy();
        this._indicator = null;



        if (this.sourceId) {
            GLib.Source.remove(this.sourceId);
            this.sourceId = null;
        }

        if (this.delaySourceId) {
            GLib.Source.remove(this.delaySourceId);
            this.delaySourceId = null;
        }
    }
}



function init(meta) {
    return new Extension(meta.uuid);
}

