import colors from 'colors';
import 'hyperswarm';
import Corestore from 'corestore';
import Networker from '@corestore/networker';
import { Settings, setSettings } from './settings.js';
import Hyperbee from 'hyperbee';
import 'hypercore';
import { getEmitter } from './state.js';
import './core.js';
import { v4 as uuidV4 } from 'uuid';
import { resolve, join } from 'path';
import { toPromises } from 'hypercore-promisifier';
import fs from 'fs';
// const Networker = {};
// #TODO create a change host name to avoid storage misplacement
export const setupCorestore = async ({ storage = Settings().storage, oldStorage = null, network = true } = {}) => {
    if (!storage) {
        storage = 'public';
        setSettings('storage', storage);
    }
    // let server;
    storage = resolve(join('./.storage', storage));
    if (oldStorage) {
        const oldstorage = resolve(join('./.storage', oldStorage));
        if (fs.existsSync(oldstorage)) {
            fs.renameSync(oldstorage, storage);
        }
    }
    const corestore = new Corestore(storage);
    await corestore.ready();
    if (network) {
        const networker = new Networker(corestore);
        return {
            corestore,
            networker,
            async cleanup() {
                // await corestore.close();
                await networker.close();
            }
        };
    }
    return {
        corestore,
        async cleanup() {
            // await corestore.close();
        }
    };
};
export async function setupBee(newbee = false) {
    var _a, _b;
    let beekey;
    const oldStorage = Settings().privateStorage;
    const storage = uuidV4().replace(/-/g, '');
    console.log('storage', storage, oldStorage);
    // at every startup it creates a new unique private storage path
    // for security even our pc cannot access our drive without knowing the storage path
    setSettings('privateStorage', storage);
    const { corestore, cleanup } = await setupCorestore({ storage, oldStorage, network: false });
    // console.log('Hyperspace daemon connected, status:');
    // console.log(await client.status());
    if (!newbee)
        beekey = Settings().beekey || undefined;
    const mainStore = corestore.namespace('main-feeds-store');
    // Create a Hyperbee
    let bee = new Hyperbee(mainStore.get({ key: beekey, name: 'awesome-bee-db' }), {
        keyEncoding: 'utf8',
        valueEncoding: 'json'
    });
    await bee.ready();
    console.log('Hyperbee ready');
    if (!bee.feed.writable) {
        bee.feed.close();
        bee = new Hyperbee(mainStore.get({ name: 'awesome-bee-db' }), {
            keyEncoding: 'utf8',
            valueEncoding: 'json'
        });
        await bee.ready();
        beekey = bee.feed.key.toString('hex');
        setSettings('beekey', beekey);
    }
    console.log('bee initiated, key:', beekey);
    if (!beekey) {
        beekey = bee.feed.key.toString('hex');
        setSettings('beekey', beekey);
    }
    const emitter = getEmitter();
    const loggerKey = await bee.sub('cores').get('logger');
    console.log('loggerKey', loggerKey);
    const logger = toPromises(mainStore.get({ name: 'logger', valueEncoding: 'json' }));
    await logger.ready(); // wait for keys to be populated
    logger.on('append', async () => {
        if (Settings().log) {
            try {
                const log = await logger.get(logger.length - 1);
                console.log(log.datetime, ...log.data);
            }
            catch (error) {
                console.log('logger:error', error);
            }
        }
    });
    emitter.on('logger', async (...data) => {
        const log = { datetime: colors.gray(new Date().toLocaleString()), data };
        await logger.append(log);
    });
    console.log(colors.gray('Core Key ' + ((_b = (_a = logger === null || logger === void 0 ? void 0 : logger.key) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a, 'hex'))));
    console.log(colors.gray('Core Writable: ' + (logger === null || logger === void 0 ? void 0 : logger.writable))); // do we possess the private key of this core?
    if (!loggerKey) {
        bee.sub('cores').put('logger', logger.key.toString('hex'));
    }
    const dataUsageBee = bee.sub('data-usage', { valueEncoding: 'utf-8' });
    emitter.on('set-data-usage', async ({ driveName = 'other', byteLength = 0, sub = 'download' } = {}) => {
        const today = new Date().toLocaleString('en', { dateStyle: 'short' });
        const subDriveUsageBee = dataUsageBee.sub(driveName).sub(sub);
        const todayUsage = await subDriveUsageBee.get(today);
        const currentUsage = (parseInt(todayUsage === null || todayUsage === void 0 ? void 0 : todayUsage.value) || 0) + byteLength;
        subDriveUsageBee.put(today, currentUsage);
        emitter.emit('data-usage', { driveName, currentUsage, sub });
        emitter.log('data-usage', { driveName, currentUsage, sub, todayUsage, byteLength });
        return currentUsage;
    });
    const corestoresBee = bee.sub('core-stores-db');
    const getNamespace = async (key) => {
        var _a;
        const namespace = key ? (_a = (await corestoresBee.get(key))) === null || _a === void 0 ? void 0 : _a.value : null;
        emitter.log('getNamespace', key, namespace);
        return namespace;
    };
    const setNamespace = async (key, namespace) => {
        corestoresBee.put(key, namespace);
    };
    // for await (const { key, value } of dataUsageBee
    // 	.sub('server')
    // 	.sub('download')
    // 	.createReadStream()) {
    // 	console.log('data-usage', { key, value });
    // }
    return { bee, corestore, cleanup, getNamespace, setNamespace };
}
