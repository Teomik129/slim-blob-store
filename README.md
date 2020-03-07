# slim-blob-store

Blob store that does the following:

- Writes to provided local and remote blob stores
- Uses local blob store as a read cache, with the remote as a fallback

```
npm install slim-blob-store
```

[![build status](http://img.shields.io/travis/Teomik129/slim-blob-store.svg?style=flat)](http://travis-ci.org/Teomik129/slim-blob-store)

[![blob-store-compatible](https://raw.githubusercontent.com/maxogden/abstract-blob-store/master/badge.png)](https://github.com/maxogden/abstract-blob-store)

## Usage

```js
const slim = require("slim-blob-store");

const blobs = slim(localBlobStore, remoteBlobStore);

const ws = blobs.createWriteStream({ key: "some-key" });
ws.end("hello slim blob!");
// `hello slim blob!` will be written to the local and the remote

blobs.createReadStream({ key: "some-key" }).pipe(process.stdout);
// If `some-key` is already in localBlobStore it will just be read from that one.
// If not it will try and copy it from remoteBlobStore
```

## License

[MIT](LICENSE)
