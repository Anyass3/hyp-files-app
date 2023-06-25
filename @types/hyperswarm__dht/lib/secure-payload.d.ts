export = HolepunchPayload;
declare class HolepunchPayload {
	constructor(holepunchSecret: any);
	_sharedSecret: any;
	_localSecret: any;
	decrypt(buffer: any): {
		error: any;
		firewall: any;
		round: any;
		connected: boolean;
		punching: boolean;
		addresses: any;
		remoteAddress: any;
		token: any;
		remoteToken: any;
	};
	encrypt(payload: any): any;
	token(addr: any): any;
}
