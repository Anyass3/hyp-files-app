import fs from 'fs';
import path from 'path';
const settingsJsonPath = path.resolve('./backend/settings.json');
const Settings = (_settings) => {
	if (!_settings) return JSON.parse(fs.readFileSync(settingsJsonPath, { encoding: 'utf-8' }));
	fs.writeFileSync(settingsJsonPath, JSON.stringify(_settings));
	console.log('Setting', _settings);
};

const setSettings = (key, value) => {
	const _settings = Settings();
	_settings[key] = value;
	fs.writeFileSync(settingsJsonPath, JSON.stringify(_settings));
	console.log('Setting', _settings);
};

export { setSettings, Settings };
