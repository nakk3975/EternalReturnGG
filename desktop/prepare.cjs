const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../src/main/resources/static'),out=path.join(__dirname,'static');
fs.mkdirSync(path.join(out,'js'),{recursive:true});
for(const name of ['animalMap','animalTimer','animalScreen','animalScreenWorker','routePlanner','siteData'])fs.copyFileSync(path.join(root,'js',name+'.js'),path.join(out,'js',name+'.js'));
for(const file of ['eng.traineddata','tesseract-core-lstm.wasm.js'])if(!fs.existsSync(path.join(root,'vendor/tesseract-7',file)))throw Error('Run java scripts/PrepareOcr.java before packaging. Missing '+file);
fs.cpSync(path.join(root,'vendor'),path.join(out,'vendor'),{recursive:true});
// The old gzip model is not used by this app.
fs.rmSync(path.join(out,'vendor/tesseract-7/eng.traineddata.gz'),{force:true});
console.log('Copied shared map, clock, OCR and data helpers.');
