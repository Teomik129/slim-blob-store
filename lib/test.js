"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tape_1 = __importDefault(require("tape"));
const _1 = __importDefault(require("./"));
const tests_1 = __importDefault(require("abstract-blob-store/tests"));
const abstract_blob_store_1 = __importDefault(require("abstract-blob-store"));
const mem = () => new abstract_blob_store_1.default();
const common = {
    setup(_t, cb) {
        cb(null, _1.default(mem(), mem()));
    },
    teardown(_t, _store, _blob, cb) {
        cb();
    }
};
tests_1.default(tape_1.default, common);
tape_1.default("slim", assert => {
    const local = mem();
    const remote = mem();
    const blobs = _1.default(local, remote);
    const slimWrite = (opts, data, callback) => {
        blobs
            .createWriteStream(opts, (err, meta) => {
            assert.error(err, "no error on create");
            assert.ok(meta, "created blob");
            callback();
        })
            .end(data);
    };
    assert.test("createWriteStream", t => {
        const opts = { key: "crs" };
        const d = "written";
        slimWrite(opts, d, () => {
            local.createReadStream(opts).once("data", data => {
                t.equal(data.toString(), d, "written to local");
                remote.createReadStream(opts).once("data", data => {
                    t.equal(data.toString(), d, "written to remote");
                    t.end();
                });
            });
        });
    });
    assert.test("createReadStream", t => {
        const opts = { key: "crs" };
        const d = "read";
        slimWrite(opts, d, () => {
            blobs.createReadStream(opts).once("data", data => {
                t.equal(data.toString(), d, "reads successfully");
                t.end();
            });
        });
    });
    assert.test("exists", t => {
        const opts = { key: "ex" };
        const d = "exists";
        slimWrite(opts, d, () => {
            blobs.exists(opts, (err, exists) => {
                t.error(err, "no error on exists");
                t.ok(exists, "blob exists");
                t.end();
            });
        });
    });
    assert.test("remove", t => {
        const opts = { key: "rm" };
        const d = "removed";
        slimWrite(opts, d, () => {
            blobs.remove(opts, err => {
                t.error(err, "no error on remove");
                blobs.createReadStream(opts).once("error", err => {
                    t.ok(err, "read should error");
                    t.end();
                });
            });
        });
    });
    assert.end();
});
//# sourceMappingURL=test.js.map