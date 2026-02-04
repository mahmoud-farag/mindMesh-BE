# Shared Data

This directory contains shared JSON data files used across both the main application and Lambda functions.

## Files

### `statics.json`

Static configuration data for the application.

```json
{
  "historyTypes": [{ "name": "chat", "value": "chat" }]
}
```

### `S3-folders.json`

S3 folder path constants.

```json
{
  "PDF_Documents": "pdf-documents",
  "text_Files": "text-files"
}
```

## Usage

### Main Application

```javascript
const statics = require("../../shared/data/statics.json");
const S3Folders = require("../../shared/data/S3-folders.json");
```

### Lambda Functions

```javascript
const statics = require("../../shared/data/statics.json");
const S3Folders = require("../../shared/data/S3-folders.json");
```

## Benefits

- ✅ **Single source of truth** - One place to update configuration
- ✅ **Consistency** - Same data across app and Lambdas
- ✅ **Easy maintenance** - Update once, applies everywhere
