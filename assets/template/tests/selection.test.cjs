const test=require('node:test');
const assert=require('node:assert/strict');
const {selectSlides,applyCut,resolveExportSlides}=require('../tools/slide-selection.cjs');
const slides=[{id:'cover'},{id:'value'},{id:'architecture'},{id:'thank-you'}];
const cuts={cio:{hidden:['value','architecture']},empty:{hidden:[]}};
test('page numbers, ranges and IDs preserve requested order and remove duplicates',()=>{
 const original=JSON.stringify(slides);
 assert.deepEqual(selectSlides(slides,'4,1,2-3,thank-you,1').map(s=>s.id),['thank-you','cover','value','architecture']);
 assert.equal(JSON.stringify(slides),original);
});
test('invalid and empty selections fail instead of silently including other pages',()=>{
 for(const value of ['', ' ', '0','5','3-2','1-5','1,','unknown'])assert.throws(()=>selectSlides(slides,value));
});
test('applyCut drops hidden ids and rejects unknown or empty-effect cuts',()=>{
 assert.deepEqual(applyCut(slides,cuts,'cio').map(s=>s.id),['cover','thank-you']);
 assert.throws(()=>applyCut(slides,cuts,'missing'),/Unknown cut/);
 assert.throws(()=>applyCut(slides,cuts,'empty'),/hides no known/);
});
test('resolveExportSlides applies cut before --slides selection',()=>{
 assert.deepEqual(
  resolveExportSlides(slides,cuts,{cut:'cio',slidesSpec:'thank-you,1'}).map(s=>s.id),
  ['thank-you','cover']
 );
 assert.deepEqual(resolveExportSlides(slides,cuts,{cut:'cio'}).map(s=>s.id),['cover','thank-you']);
});
