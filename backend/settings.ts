import fs from 'fs';
import path from 'path';
const settingsJsonPath = path.resolve('./settings.json');
type SettingsType = {
	fs: string;
	beekey: string;
	username: string;
	log: boolean;
	debug: boolean;
	publicStorage?: string;
	storage?: string;
	privateStorage: string;
};
const Settings: (_settings?: Partial<SettingsType> | null) => SettingsType = (_settings = null) => {
	if (!fs.existsSync(settingsJsonPath)) {
		_settings = {
			fs: '/',
			beekey: '',
			username: 'me',
			log: false,
			debug: true
		};
		fs.writeFileSync(settingsJsonPath, JSON.stringify(_settings));
		return _settings;
	}
	if (!_settings) return JSON.parse(fs.readFileSync(settingsJsonPath, { encoding: 'utf-8' }));
	fs.writeFileSync(settingsJsonPath, JSON.stringify(_settings));
	// console.log('Setting', _settings);
};

const setSettings = (key, value) => {
	const _settings = Settings();
	_settings[key] = value;
	fs.writeFileSync(settingsJsonPath, JSON.stringify(_settings));
	// console.log('Setting', _settings);
};

export { setSettings, Settings };
