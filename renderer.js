const Vue = require('vue/dist/vue.js');
const draggable = require('vuedraggable');
const remote = require('electron').remote;
const { ipcRenderer } = require('electron');
const dialog = remote.dialog;

ipcRenderer.on('set-buttons', (evt, { buttons, deviceOnline }) => {
    const app = new Vue({
        el: '#el-app',
        data: {
            buttons,
            selected: false,
            deviceOnline,
        },
        methods: {
            select: function (i) {
                this.selected = this.buttons[i];
            },
            move: function (evt, origEvt) {
                this.newIndex = evt.draggedContext.futureIndex;
                this.oldIndex = evt.draggedContext.index;
                return false;
            },
            end: function (evt) {
                const t = this.buttons[this.newIndex];
                this.buttons[this.newIndex] = this.buttons[this.oldIndex];
                this.buttons[this.oldIndex] = t;
                app.$forceUpdate();
            },
            syncSettings: function () {
                ipcRenderer.send('sync-settings', buttons);
            },
            selectFile: function (field, extensions = []) {
                const vm = this;
                dialog.showOpenDialog({
                    properties: ['openFile'],
                    filters: [
                        {
                            name: 'Images',
                            extensions,
                        },
                    ],
                }, filename => {
                    if (filename) {
                        this.selected[field] = filename[0];
                    }
                });
            },
            clearSelected: function () {
                this.selected.name = '';
                this.selected.icon = '';
                this.selected.command = '';
            }
        },
        components: { draggable }
    });
});

ipcRenderer.send('ping');
