export namespace wire {
    namespace handshake {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            capability: any;
        };
        function decode(state: any): {
            capability: any;
        };
    }
    namespace request {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            id: any;
            fork: any;
            block: {
                index: any;
                nodes: any;
            };
            hash: {
                index: any;
                nodes: any;
            };
            seek: {
                bytes: any;
            };
            upgrade: {
                start: any;
                length: any;
            };
        };
        function decode(state: any): {
            id: any;
            fork: any;
            block: {
                index: any;
                nodes: any;
            };
            hash: {
                index: any;
                nodes: any;
            };
            seek: {
                bytes: any;
            };
            upgrade: {
                start: any;
                length: any;
            };
        };
    }
    namespace cancel {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any, m: any): {
            request: any;
        };
        function decode(state: any, m: any): {
            request: any;
        };
    }
    namespace data {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            request: any;
            fork: any;
            block: {
                index: any;
                value: any;
                nodes: any;
            };
            hash: {
                index: any;
                nodes: any;
            };
            seek: {
                bytes: any;
                nodes: any;
            };
            upgrade: {
                start: any;
                length: any;
                nodes: any;
                additionalNodes: any;
                signature: any;
            };
        };
        function decode(state: any): {
            request: any;
            fork: any;
            block: {
                index: any;
                value: any;
                nodes: any;
            };
            hash: {
                index: any;
                nodes: any;
            };
            seek: {
                bytes: any;
                nodes: any;
            };
            upgrade: {
                start: any;
                length: any;
                nodes: any;
                additionalNodes: any;
                signature: any;
            };
        };
    }
    namespace noData {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any, m: any): {
            request: any;
        };
        function decode(state: any, m: any): {
            request: any;
        };
    }
    namespace want {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            start: any;
            length: any;
        };
        function decode(state: any): {
            start: any;
            length: any;
        };
    }
    namespace unwant {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any, m: any): {
            start: any;
            length: any;
        };
        function decode(state: any, m: any): {
            start: any;
            length: any;
        };
    }
    namespace range {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            drop: boolean;
            start: any;
            length: any;
        };
        function decode(state: any): {
            drop: boolean;
            start: any;
            length: any;
        };
    }
    namespace bitfield {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any, m: any): {
            start: any;
            bitfield: any;
        };
        function decode(state: any, m: any): {
            start: any;
            bitfield: any;
        };
    }
    namespace sync {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            fork: any;
            length: any;
            remoteLength: any;
            canUpgrade: boolean;
            uploading: boolean;
            downloading: boolean;
        };
        function decode(state: any): {
            fork: any;
            length: any;
            remoteLength: any;
            canUpgrade: boolean;
            uploading: boolean;
            downloading: boolean;
        };
    }
    namespace reorgHint {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            from: any;
            to: any;
            ancestors: any;
        };
        function decode(state: any): {
            from: any;
            to: any;
            ancestors: any;
        };
    }
    namespace extension {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            name: any;
            message: any;
        };
        function decode(state: any): {
            name: any;
            message: any;
        };
    }
}
export namespace oplog {
    namespace entry {
        function preencode(state: any, m: any): void;
        function preencode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function encode(state: any, m: any): void;
        function decode(state: any): {
            userData: {
                key: any;
                value: any;
            };
            treeNodes: any;
            treeUpgrade: {
                fork: any;
                ancestors: any;
                length: any;
                signature: any;
            };
            bitfield: {
                drop: boolean;
                start: any;
                length: any;
            };
        };
        function decode(state: any): {
            userData: {
                key: any;
                value: any;
            };
            treeNodes: any;
            treeUpgrade: {
                fork: any;
                ancestors: any;
                length: any;
                signature: any;
            };
            bitfield: {
                drop: boolean;
                start: any;
                length: any;
            };
        };
    }
    namespace header {
        function preencode(state: any, h: any): void;
        function preencode(state: any, h: any): void;
        function encode(state: any, h: any): void;
        function encode(state: any, h: any): void;
        function decode(state: any): {
            types: {
                tree: any;
                bitfield: any;
                signer: any;
            };
            userData: any;
            tree: {
                fork: any;
                length: any;
                rootHash: any;
                signature: any;
            };
            signer: {
                publicKey: any;
                secretKey: any;
            };
            hints: {
                reorgs: any;
            };
        };
        function decode(state: any): {
            types: {
                tree: any;
                bitfield: any;
                signer: any;
            };
            userData: any;
            tree: {
                fork: any;
                length: any;
                rootHash: any;
                signature: any;
            };
            signer: {
                publicKey: any;
                secretKey: any;
            };
            hints: {
                reorgs: any;
            };
        };
    }
}
