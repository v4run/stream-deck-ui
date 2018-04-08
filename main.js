const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { exec } = require("child_process");
const { device } = require('./streamdeck');

const CONFIGFILE = './src/config.json';
const MAXBUTTONS = 15;

let mainWindow;
let buttons;

try {
    buttons = require(CONFIGFILE);
} catch (err) {
    console.error(err);
    buttons = new Array(MAXBUTTONS);
    for (let i = 0; i < MAXBUTTONS; i++) {
        buttons[i] = { name: '', icon: '', command: '' };
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({ width: 500, height: 600, resizable: false })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))
    mainWindow.on('closed', function () {
        mainWindow = null
    })

    ipcMain.on('sync-settings', (evt, btns) => {
        buttons = btns;
        try {
            fs.writeFileSync(CONFIGFILE, JSON.stringify(buttons), 'utf-8');
            setButtons(buttons);
        } catch (e) {
            console.error(e);
        }
    });

    ipcMain.on('ping', (evt) => {
        const deviceOnline = device && true || false;
        if (deviceOnline) {
            setButtons(buttons);
        }
        evt.sender.send('set-buttons', {buttons, deviceOnline});
    });
}
app.on('ready', createWindow)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
    ipcMain.removeAllListeners('ping');
    ipcMain.removeAllListeners('sync-settings');
})

app.on('quit', () => {
    if (device) {
        console.log('Closing device.')
        device.clearAllKeys();
        device.device.close();
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})

const setButtons = buttons => {
    buttons.map((k, i) => {
        if (!k.icon) {
            device.clearKey(i);
            return;
        }
        device.fillImageFromFile(i, path.resolve(__dirname, k.icon)).then(() => {
            console.log(`Successfully set icon ${k.icon} to key ${i}.`);
        });
    });
}

if (device) {
    device.on("up", keyIndex => {
        const command = buttons[keyIndex].command;
        if (!command) {
            return;
        }
        exec(command.toString(), (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            if (stdout) {
                console.log(stdout);
            }
            if (stderr) {
                console.error(stderr);
            }
        });
    });

    device.on('error', error => {
        console.error(error);
    });
}
