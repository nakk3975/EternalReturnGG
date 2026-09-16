# Local-only OCR assets

Tesseract.js 7.0.0 browser and worker bundles are committed with their licenses.
The large Tesseract.js-core 7.0.0 LSTM WASM bundle and tessdata_fast 4.1.0 English model are downloaded by `java scripts/PrepareOcr.java` with mandatory SHA-256 checks. Gradle runs this before `processResources`; browser CI runs it before OCR tests. Both files are packaged in the WAR and served from this application. No browser requests to external OCR services or pixel uploads are used.

The English model is byte-identical to the Debian English fast data used in earlier local tests (Git blob bbef4675053b5b468cdb477053e28b1c698ba08e). It is served uncompressed with `gzip:false`. Run the preparation command before standalone browser tests.

Sources: https://github.com/naptha/tesseract.js , https://github.com/naptha/tesseract.js-core , https://github.com/tesseract-ocr/tessdata_fast/tree/4.1.0 . Hashes are in SHA256SUMS and enforced by the preparation script.
