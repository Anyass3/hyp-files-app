export = Persistent;
declare class Persistent {
	static signMutable(seq: any, value: any, secretKey: any): any;
	static verifyMutable(signature: any, seq: any, value: any, publicKey: any): any;
	static signAnnounce(target: any, token: any, id: any, ann: any, secretKey: any): any;
	static signUnannounce(target: any, token: any, id: any, ann: any, secretKey: any): any;
	constructor(
		dht: any,
		{
			maxSize,
			maxAge
		}: {
			maxSize: any;
			maxAge: any;
		}
	);
	dht: any;
	records: any;
	refreshes: any;
	mutables: any;
	immutables: any;
	onlookup(req: any): void;
	onfindpeer(req: any): void;
	unannounce(target: any, publicKey: any): void;
	onunannounce(req: any): void;
	_onrefresh(token: any, req: any): void;
	onannounce(req: any): void;
	onmutableget(req: any): void;
	onmutableput(req: any): void;
	onimmutableget(req: any): void;
	onimmutableput(req: any): void;
}
