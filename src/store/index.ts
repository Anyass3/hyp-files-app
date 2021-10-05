// imports stores-x lib
import StoreX from 'stores-x';
//
// imports stores to be centralized by stores-x
import main from './main';
import prompt from './prompt';
import socket from './socket';
import actions from './actions';
import persistant from './persistant';

//
//
export default StoreX([main, prompt, socket, persistant, actions]);
