import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const S3Folders = require('./S3-folders.json');
const statics = require('./statics.json');

export {
    S3Folders,
    statics
};

export default {
    S3Folders,
    statics
};
