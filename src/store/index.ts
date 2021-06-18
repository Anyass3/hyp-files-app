import StoreX from 'stores-x';
import main from './main';
import prompt from './prompt';
import socket from './socket';

export default StoreX([main, prompt, socket], { mutation: '', action: '', getter: '' });
