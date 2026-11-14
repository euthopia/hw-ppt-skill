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
