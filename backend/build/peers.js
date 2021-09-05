// import lodash from 'lodash';
import colors from 'colors';
import './drive.js';
import { Settings } from './settings.js';
import { getEmitter } from './state.js';
import './core.js';
const config = Settings();
const emitter = getEmitter();
export async function Extention(core, peer = '') {
    // create a messenger ext. any peer can send and recieve messages when connected
    const events = {};
    const ext = {
        send: (message, peer) => { },
        broadcast: (event, message) => { },
        emit: (event, message, peer) => { },
        info: ({ corekey, drivekey, username }, peer) => { },
        on: async (event, fn) => {
            const fns = events[event] || [];
            events[event] = fns.concat(fn);
        }
    };
    const _ext = core.registerExtension(peer + 'extention', {
        encoding: 'json',
        onmessage: ({ event, data }, peer) => {
            var _a, _b;
            console.log(colors.blue(`ext ${peer.remoteAddress}:`), event, colors.green(data));
            (_b = (_a = events[event]) === null || _a === void 0 ? void 0 : _a.forEach) === null || _b === void 0 ? void 0 : _b.call(_a, async (fn) => {
                try {
                    return await fn(data);
                }
                catch (error) {
                    console.log(colors.red('error: ' + error.message));
                }
            });
            // if (event === 'info') oninfo(data, peer);
            // else onmessage(data, peer);
        }
    });
    ext.send = (data, peer) => {
        _ext.send({ event: 'message', data }, peer);
    };
    ext.emit = (event, data, peer) => {
        _ext.send({ event, data }, peer);
    };
    ext.info = ({ corekey, drivekey, username = config.username }, peer) => {
        let info = {
            event: 'info',
            data: {
                corekey,
                drivekey,
                username
            }
        };
        if (peer)
            _ext.send(info, peer);
        else
            _ext.broadcast(info);
    };
    ext.broadcast = (event, data) => {
        _ext.broadcast({ event, data });
    };
    ext.on('update-core', async () => {
        core.update();
    });
    if (core.writable) {
        core.on('append', async () => {
            ext.broadcast('update-core');
            const idx = core.length - 1;
            console.log(colors.blue('log: ' + idx), await core.get(idx));
        });
    }
    return ext;
}
export async function Connect(client, corekey, api) {
    // if I joined with another peer's public key
    // const core = await startCore({ ...client, key:corekey });
    // const drive = await Drive(client.corestore(), await core.get(0));
    // corekey = core.key.toString('hex');
    // api.addPeer({
    // 	corekey,
    // 	drivekey: drive.$key
    // });
    // api.peerCores.set(corekey, core);
    // api.peerDrives.set(drive.$key, drive);
    // core.on('close', async () => {
    // 	api.removePeer(corekey);
    // });
    // const { ext } = Extention(core);
    // return { core, drive, ext };
}
