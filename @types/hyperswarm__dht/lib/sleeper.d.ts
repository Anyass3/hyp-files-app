export = Sleeper;
declare class Sleeper {
    _timeout: NodeJS.Timeout;
    _resolve: any;
    _start: (resolve: any) => void;
    _trigger: () => void;
    pause(ms: any): Promise<any>;
    resume(): void;
}
