'use strict';
importScripts('/static/js/animalScreen.js?v=20260916-screen1');
onmessage=({data})=>{const {frame,roi,template,epoch,token}=data;postMessage({found:erScreenLocate(frame,roi,template),epoch,token});};
