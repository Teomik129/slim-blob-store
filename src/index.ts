import pump from "pump";
import { duplexify } from "@justinbeckwith/duplexify";
import logging from "logdown";

import {
  AbstractBlobStore,
  BlobKey,
  CreateCallback,
  ExistsCallback,
  RemoveCallback
} from "abstract-blob-store";

const logger = logging("slim-blob-store");

const noop = () => {};

/**
 * Slim Blob class
 */
export class Slim implements AbstractBlobStore {
  private local: AbstractBlobStore;
  private remote: AbstractBlobStore;

  /**
   * Instantiate the slim blob
   */
  constructor(local: AbstractBlobStore, remote: AbstractBlobStore) {
    this.local = local;
    this.remote = remote;
  }

  createWriteStream(
    opts: BlobKey,
    callback: CreateCallback
  ): NodeJS.WriteStream {
    const { local, remote } = this;
    return remote.createWriteStream(opts, (err, meta) => {
      if (err) return callback(err, meta);
      pump(
        remote.createReadStream(meta),
        local.createWriteStream(opts, callback)
      );
    });
  }
  createReadStream(opts: BlobKey): NodeJS.ReadStream {
    const { local, remote } = this;
    const dup = duplexify();

    dup.setWritable(null);

    local.exists(opts, (err, exists) => {
      if (err) return dup.destroy(err);

      if (exists) {
        logger.debug("createReadStream from local");
        return dup.setReadable(local.createReadStream(opts));
      } else logger.debug("createReadStream copying from remote");

      // copy remote blob into the local
      pump(
        remote.createReadStream(opts),
        local.createWriteStream(opts, (err, meta) => {
          if (err) return dup.destroy(err);
          dup.setReadable(local.createReadStream(meta));
        }),
        err => {
          if (err) return dup.destroy(err); // in case the local doesn't do destroy
        }
      );
    });

    return (dup as unknown) as NodeJS.ReadStream;
  }
  exists(opts: BlobKey, callback: ExistsCallback): void {
    const { local, remote } = this;
    local.exists(opts, (err, exists) => {
      if (err) return callback(err, exists);
      if (exists) return callback(null, exists);
      remote.exists(opts, callback);
    });
  }
  remove(opts: BlobKey, callback: RemoveCallback = noop): void {
    const { local, remote } = this;

    local.remove(opts, err => {
      if (err) return callback(err);
      remote.remove(opts, callback);
    });
  }
}

export default (local: AbstractBlobStore, remote: AbstractBlobStore) =>
  new Slim(local, remote);
