/* Seam: export.cjs pptx format writes editable Office file from deck.json. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync,existsSync,statSync}=require('node:fs');
const {execFileSync,spawnSync}=require('node:child_process');
const path=require('node:path');
const os=require('node:os');

function pythonPptxAvailable(){
 const probe=spawnSync(process.execPath,['tools/python-cmd.cjs','-c','import pptx'],{
  encoding:'utf8',windowsHide:true
 });
 return probe.status===0;
}

test('export CLI documents pptx and rejects unknown formats',()=>{
 const help=execFileSync(process.execPath,['tools/export.cjs','--help'],{encoding:'utf8'});
 assert.match(help,/pptx/);
 assert.throws(
  ()=>execFileSync(process.execPath,['tools/export.cjs','docx'],{stdio:'pipe'}),
  error=>/Format must be/.test(String(error.stderr))
 );
});

test('pptx export writes a non-empty .pptx when python-pptx is installed',{skip:!pythonPptxAvailable()},()=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'pptx-export-'));
 try{
  execFileSync(process.execPath,['tools/export.cjs','pptx','--lang','zh','--output-dir',directory],{
   stdio:'pipe'
  });
  const file=path.join(directory,'presentation-zh.pptx');
  assert.ok(existsSync(file),'expected presentation-zh.pptx');
  assert.ok(statSync(file).size>1000,'pptx should be a real Office package');
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('pptx builder uses native tables for table layouts',{skip:!pythonPptxAvailable()},()=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'pptx-table-'));
 const deckPath=path.join(directory,'deck.json');
 const out=path.join(directory,'out.pptx');
 try{
  const {writeFileSync}=require('node:fs');
  writeFileSync(deckPath,JSON.stringify({
   id:'pptx-table-check',
   title:{zh:'表',en:'Table'},
   slides:[
    {
     type:'table',
     id:'grid',
     title:{zh:'对照',en:'Grid'},
     headers:[{zh:'项',en:'Item'},{zh:'值',en:'Value'}],
     rows:[[{zh:'A',en:'A'},{zh:'1',en:'1'}],[{zh:'B',en:'B'},{zh:'2',en:'2'}]],
     notes:{zh:'备注行',en:'Note line'}
    }
   ]
  }));
  execFileSync(process.execPath,['tools/python-cmd.cjs','tools/export_pptx.py','--lang','zh','--deck',deckPath,'--output',out],{
   stdio:'pipe'
  });
  const probe=spawnSync(process.execPath,['tools/python-cmd.cjs','-c',
   'from pptx import Presentation; p=Presentation(r"'+out.replace(/\\/g,'\\\\')+'"); s=p.slides[0];\n'
   +'assert any(shape.has_table for shape in s.shapes), "expected native table"\n'
   +'assert "备注行" in s.notes_slide.notes_text_frame.text\n'
   +'assert any(shape.shape_type is not None for shape in s.shapes)\n'
  ],{encoding:'utf8',windowsHide:true});
  assert.equal(probe.status,0,probe.stderr||probe.stdout);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
