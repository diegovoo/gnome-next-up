const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const modelColumn = {
    label: 0,
    separator: 1
}


function init() {
}

var NextUpPrefsWidget = new GObject.registerClass(class NextUp_NextUpPrefsWidget extends Gtk.Grid {

    _init() {
        super.init();
        this.margin = this.row_spacing = this.column_spacing = 20;
        
        this._seginds = ExtensionUtils.getSettings();

        let i = 0;
        let j = 0;

        this._addLabel({
            label: _('Display Options'),
            y : i++, x : j
        });

        this._addComboBox({
            label: _('Panel to show indicator in'),
            items : {left : _('Left'), center : _('Center'), right : _('Right')},
            key: 'which-panel', y : i++, x : j
        });

        this._addComboBox({
            label: _('Show next events starting'),
            items : {today : _('Today'), week : _('This week'), month : _('This month')},
            key: 'events-starting', y : i++, x : j
        });

    }

    _addLabel(params){
        let lbl = new Gtk.Label({label: params.label,halign : Gtk.Align.END});
        this.attach(lbl, params.x, params.y, 1, 1);
        }

    _addComboBox(params){
        let model = new Gtk.ListStore();
        model.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);

        let combobox = new Gtk.ComboBox({model: model});
        let renderer = new Gtk.CellRendererText();
        combobox.pack_start(renderer, true);
        combobox.add_attribute(renderer, 'text', 1);

        for(let k in params.items){
            model.set(model.append(), [0, 1], [k, params.items[k]]);
        }

        combobox.set_active(Object.keys(params.items).indexOf(this._settings.get_string(params.key)));

        combobox.connect('changed', (entry) => {
            let [success, iter] = combobox.get_active_iter();
            if (!success)
                return;
            this._settings.set_string(params.key, model.get_value(iter, 0))
        });

        this._addLabel(params);

        this.attach(combobox, params.x + 1, params.y, 1, 1);
    }

});


function buildPrefsWidget() {
    return new NextUpPrefsWidget();
}
