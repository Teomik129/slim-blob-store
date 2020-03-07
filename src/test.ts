import tape from "tape";
import { slim } from "./";
import abstractBlobTests from "abstract-blob-store/tests";
import Mem, { AbstractBlobStore, BlobMetadata } from "abstract-blob-store";

const mem = () => new Mem();

interface Common {
  setup(
    test: typeof tape,
    callback: (error: Error, store: AbstractBlobStore) => void
  ): void;
  teardown(
    test: typeof tape,
    store: AbstractBlobStore,
    blob: BlobMetadata,
    callback: (error?: Error) => void
  ): void;
}

const common: Common = {
  setup(_t, cb) {
    cb(null, slim(mem(), mem()));
  },
  teardown(_t, _store, _blob, cb) {
    cb();
  }
};

abstractBlobTests(tape, common);

tape("slim", assert => {
  const local = mem();
  const remote = mem();
  const blobs = slim(local, remote);

  const slimWrite = (opts: Mem.BlobKey, data: string, callback: () => void) => {
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
