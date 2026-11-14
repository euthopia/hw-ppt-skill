/* Seam: render.py public HTML for table / timeline / callouts layouts. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,rmSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const os=require('node:os');

function bilingual(zh,en){return {zh,en};}

function renderFixture(slides){
 const root=mkdtempSync(path.join(os.tmpdir(),'layout-seam-'));
 for(const dir of ['tools','content','js','css','assets']){
  cpSync(path.join(process.cwd(),dir),path.join(root,dir),{recursive:true});
 }
 const deck={
  id:'layout-seam-check',
  title:bilingual('版式检查','Layout check'),
  slides
 };
 writeFileSync(path.join(root,'content/deck.json'),JSON.stringify(deck,null,2));
 execFileSync(process.execPath,['tools/python-cmd.cjs','tools/render.py'],{cwd:root,stdio:'pipe'});
 const html=readFileSync(path.join(root,'index.html'),'utf8');
 const css=readFileSync(path.join(root,'css/components.css'),'utf8');
 return {root,html,css};
}

test('table layout wraps sticky-header scroll region',()=>{
 const {root,html,css}=renderFixture([{
  type:'table',
  title:bilingual('表格','Table'),
  headers:[bilingual('列A','Col A'),bilingual('列B','Col B')],
  rows:[[bilingual('一','One'),bilingual('二','Two')],
        [bilingual('三','Three'),bilingual('四','Four')],
        [bilingual('五','Five'),bilingual('六','Six')],
        [bilingual('七','Seven'),bilingual('八','Eight')],
        [bilingual('九','Nine'),bilingual('十','Ten')],
        [bilingual('十一','Eleven'),bilingual('十二','Twelve')],
        [bilingual('十三','Thirteen'),bilingual('十四','Fourteen')]]
 }]);
 try{
  assert.match(html,/class="kit-table-scroll"/);
  assert.match(html,/class="kit-table"/);
  assert.match(css,/kit-table-scroll/);
  assert.match(css,/position:\s*sticky/);
  assert.match(css,/var\(--surface\)/);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('agenda quote and tabs layouts render branded markup',()=>{
 const {root,html,css}=renderFixture([
  {
   type:'agenda',
   title:bilingual('议程','Agenda'),
   items:[
    {label:bilingual('价值','Value'),time:bilingual('5分','5m')},
    {label:bilingual('能力','Capability')},
    {label:bilingual('证明','Proof')}
   ]
  },
  {
   type:'quote',
   title:bilingual('证言','Quote'),
   quote:bilingual('稳定可靠。','Stable and reliable.'),
   attribution:bilingual('某 CIO','A CIO'),
   role:bilingual('金融','Finance')
  },
  {
   type:'tabs',
   title:bilingual('页签','Tabs'),
   tabs:[
    {id:'one',label:bilingual('方案甲','Plan A'),body:bilingual('说明甲','Body A')},
    {id:'two',label:bilingual('方案乙','Plan B'),body:bilingual('说明乙','Body B'),bullets:[bilingual('点','Point')]}
   ]
  }
 ]);
 try{
  assert.match(html,/class="kit-agenda"/);
  assert.match(html,/class="kit-quote"/);
  assert.match(html,/data-tabs-root/);
  assert.match(html,/tabs\.js/);
  assert.match(css,/kit-agenda/);
  assert.match(css,/kit-quote/);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('before-after layout renders dual panels',()=>{
 const {root,html,css}=renderFixture([{
  type:'before-after',
  title:bilingual('前后','Before after'),
  before:{
   label:bilingual('之前','Before'),
   title:bilingual('旧态','Old state'),
   body:bilingual('痛点说明','Pain body'),
   bullets:[bilingual('痛点一','Pain one')]
  },
  after:{
   label:bilingual('之后','After'),
   title:bilingual('新态','New state'),
   body:bilingual('收益说明','Gain body'),
   bullets:[bilingual('收益一','Gain one')]
  }
 }]);
 try{
  assert.match(html,/class="kit-before-after"/);
  assert.match(html,/data-ba-side="before"/);
  assert.match(html,/data-ba-side="after"/);
  assert.match(css,/kit-before-after/);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('timeline and callouts layouts render branded markup',()=>{
 const {root,html}=renderFixture([
  {
   type:'timeline',
   title:bilingual('里程碑','Milestones'),
   events:[
    {when:bilingual('第1周','Week 1'),title:bilingual('发现','Discovery'),body:bilingual('摸底','Assess')},
    {when:bilingual('第2周','Week 2'),title:bilingual('方案','Design'),body:bilingual('对齐','Align')},
    {when:bilingual('第3周','Week 3'),title:bilingual('落地','Deliver'),body:bilingual('上线','Ship')}
   ]
  },
  {
   type:'callouts',
   title:bilingual('关键信息','Key points'),
   items:[
    {tone:'info',title:bilingual('说明','Note'),body:bilingual('背景','Context')},
    {tone:'warn',title:bilingual('注意','Caution'),body:bilingual('风险','Risk')},
    {tone:'accent',title:bilingual('行动','Action'),body:bilingual('下一步','Next')}
   ]
  }
 ]);
 try{
  assert.match(html,/class="kit-timeline"/);
  assert.match(html,/data-timeline-step="0"/);
  assert.match(html,/class="kit-callouts"/);
  assert.match(html,/data-callout-tone="warn"/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
