"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pump_1 = __importDefault(require("pump"));
const duplexify_1 = require("@justinbeckwith/duplexify");
const logdown_1 = __importDefault(require("logdown"));
const logger = logdown_1.default("slim-blob-store");
const noop = () => { };
/**
 * Slim Blob class
 */
class Slim {
    /**
     * Instantiate the slim blob
     */
    constructor(local, remote) {
        this.local = local;
        this.remote = remote;
    }
    createWriteStream(opts, callback) {
        const { local, remote } = this;
        return remote.createWriteStream(opts, (err, meta) => {
            if (err)
                return callback(err, meta);
            pump_1.default(remote.createReadStream(meta), local.createWriteStream(opts, callback));
        });
    }
    createReadStream(opts) {
        const { local, remote } = this;
        const dup = duplexify_1.duplexify();
        dup.setWritable(null);
        local.exists(opts, (err, exists) => {
            if (err)
                return dup.destroy(err);
            if (exists) {
                logger.debug("createReadStream from local");
                return dup.setReadable(local.createReadStream(opts));
            }
            else
                logger.debug("createReadStream copying from remote");
            // copy remote blob into the local
            pump_1.default(remote.createReadStream(opts), local.createWriteStream(opts, (err, meta) => {
                if (err)
                    return dup.destroy(err);
                dup.setReadable(local.createReadStream(meta));
            }), err => {
                if (err)
                    return dup.destroy(err); // in case the local doesn't do destroy
            });
        });
        return dup;
    }
    exists(opts, callback) {
        const { local, remote } = this;
        local.exists(opts, (err, exists) => {
            if (err)
                return callback(err, exists);
            if (exists)
                return callback(null, exists);
            remote.exists(opts, callback);
        });
    }
    remove(opts, callback = noop) {
        const { local, remote } = this;
        local.remove(opts, err => {
            if (err)
                return callback(err);
            remote.remove(opts, callback);
        });
    }
}
exports.Slim = Slim;
exports.default = (local, remote) => new Slim(local, remote);
//# sourceMappingURL=index.js.map