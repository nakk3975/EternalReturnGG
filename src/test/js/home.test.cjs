const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const events = new Map();
const pending = new Promise(() => {});
const $ = value => {
    if (typeof value === 'function') { value(); return; }
    return {on: (event, fn) => events.set(value + ':' + event, fn), text() {}, html() {}};
};
$.ajax = () => pending;
vm.runInNewContext(fs.readFileSync('src/main/resources/static/js/home.js', 'utf8'), {
    $, loadAssetConfig: () => pending, loadCharacterData: () => pending,
    loadKoreanCharacterNames: () => pending
});
assert.equal(typeof events.get('#searchForm:submit'), 'function');
console.log('PASS: search handler available while every home data request remains pending');
