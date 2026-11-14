"""Generate a bilingual deck from content/deck.json. Soft-dep: jsonschema (optional)."""
from pathlib import Path
import html,json,re,sys,uuid
ROOT=Path(__file__).resolve().parent.parent
def template_runtime_version():
 package=ROOT/'package.json'
 if package.is_file():
  try:return str(json.loads(package.read_text(encoding='utf-8')).get('version') or '1.0.0')
  except (json.JSONDecodeError,TypeError,ValueError):pass
 return '1.0.0'
TEMPLATE_RUNTIME_VERSION=template_runtime_version()
D=json.loads((ROOT/'content/deck.json').read_text(encoding='utf-8'))

def validate_deck_schema(deck):
 schema_path=ROOT/'schemas'/'deck.schema.json'
 if not schema_path.is_file():return
 try:
  import jsonschema
 except ImportError:
  sys.stderr.write(
   'Warning: jsonschema not installed; skipping deck.schema.json validation. '
   'Install with: pip install jsonschema\n'
  )
  return
 schema=json.loads(schema_path.read_text(encoding='utf-8'))
 try:
  validator_cls=jsonschema.validators.validator_for(schema)
  validator_cls.check_schema(schema)
  validator=validator_cls(schema)
 except Exception:
  validator=None
 if validator is None:
  try:
   jsonschema.validate(instance=deck,schema=schema)
   return
  except jsonschema.ValidationError as err:
   path='.'.join(str(p) for p in err.path) or '(root)'
   raise ValueError(f'deck.json failed schema validation:\n  - {path}: {err.message}') from err
 errors=sorted(validator.iter_errors(deck),key=lambda e:list(e.absolute_path))
 if not errors:return
 lines=[]
 for err in errors[:12]:
  path='.'.join(str(p) for p in err.absolute_path) or '(root)'
  lines.append(f'  - {path}: {err.message}')
 raise ValueError('deck.json failed schema validation:\n'+'\n'.join(lines))

validate_deck_schema(D)

translations={
 '屏蔽页面':'Hide slides',
 '恢复全部':'Restore all',
 '取消':'Cancel',
 '保存':'Save',
 '不演示':'Hidden',
 '勾选不演示的页面，再保存':'Select slides to hide, then save',
 '至少保留一页用于演示':'Keep at least one slide in the presentation',
 '仅当前浏览器生效':'Applies only to this browser',
 '已屏蔽':'Hidden',
 '已保存页面屏蔽设置':'Slide visibility settings saved',
 '浏览器无法保存设置，本次会话仍会生效':'Settings could not be saved in this browser; they still apply to this session',
 '已屏蔽，请在目录中恢复后演示':'Hidden. Restore this slide in the overview to present it',

 '开场':'Opening','演示控制':'Presentation controls','上一页':'Previous slide','下一页':'Next slide',
 '上一页 · ← / Page Up':'Previous slide · ← / Page Up','下一页 · → / 空格':'Next slide · → / Space',
 '打开目录 · G':'Open overview · G','目录':'Overview','目录 · G':'Overview · G','全屏':'Fullscreen',
 '全屏 · F':'Fullscreen · F','退出全屏':'Exit fullscreen','演示章节':'Presentation chapters',
 '切换到英文':'Switch to English','演示目录':'Presentation overview','关闭目录':'Close overview',
 '点击页面直接跳转':'Click a slide to jump','Esc 关闭':'Esc to close',
 '自动演示':'Auto presentation','暂停':'Pause','继续':'Continue','重播':'Replay','完整示意':'Show all',
 '场景切换':'Scenario switcher',
 '当前浏览器不支持网页全屏，可使用浏览器的全屏功能。':'Use your browser fullscreen mode.',
 '全屏未能开启，可使用浏览器的全屏功能。':'Use your browser fullscreen mode.',
 '快捷键：← → 翻页 · G 目录 · F 全屏 · EN 语言':'Shortcuts: ← → navigate · G overview · F fullscreen · EN language',
 '快捷键：← → 翻页 · G 目录 · N 备注 · F 全屏 · ? 对照 · EN 语言':'Shortcuts: ← → navigate · G overview · N notes · F fullscreen · ? help · EN language',
 '演示备注':'Presenter notes',
 '下一页预告':'Up next',
 '按 N 关闭备注':'Press N to hide notes',
 '快捷键对照':'Keyboard shortcuts',
 '关闭快捷键对照':'Close shortcuts',
 '翻页':'Navigate',
 '目录':'Overview',
 '全屏':'Fullscreen',
 '本对照表':'This cheat sheet',
 '关闭对话框':'Close dialog',
 'URL 参数：?cut=名称 分享切片；?presenter=1 打开备注。':'URL params: ?cut=name for a shareable cut; ?presenter=1 for notes.',
 '激光笔':'Laser pointer',
 '演示计时':'Elapsed timer',
 '页签切换':'Tab panels',
 '激光笔已开启':'Laser pointer on',
 '激光笔已关闭':'Laser pointer off',
}
def source(value):
 if isinstance(value,dict):
  if set(value)!= {'zh','en'} or not all(isinstance(value[k],str) for k in value): raise ValueError('Bilingual text requires {zh: string, en: string}')
  zh,en=value['zh'],value['en']
  if zh in translations and translations[zh]!=en:raise ValueError('Conflicting translation: '+zh)
  translations[zh]=en;return zh
 if not isinstance(value,str):raise ValueError('Text requires a string or zh/en object')
 return value

def text(value):return html.escape(source(value),quote=True)
def items(values,tag='span'):return ''.join(f'<{tag}>{text(v)}</{tag}>' for v in values)
def bounded(values,low,high,label):
 if not low<=len(values)<=high:raise ValueError(f'{label} must contain {low}–{high} items; split dense content into another slide')
 return values

LAYOUTS={}
FULL_SLIDE={}
def register_layout(kind,fn):
 if kind in LAYOUTS:raise ValueError('Duplicate layout registration: '+kind)
 LAYOUTS[kind]=fn
def register_full_slide(kind,css_class,fn):
 register_layout(kind,fn)
 FULL_SLIDE[kind]=css_class

def layout_cards(slide):
 cards=bounded(slide['cards'],2,4,'cards')
 return '<div class="kit-cards">'+''.join(f'<article class="kit-card"><span class="kit-index">{i+1:02}</span><h3>{text(c["title"])}</h3><p>{text(c["body"])}</p></article>' for i,c in enumerate(cards))+'</div>'

def layout_metrics(slide):
 metrics=bounded(slide['metrics'],2,4,'metrics')
 return '<div class="kit-metrics">'+''.join(f'<article><b>{text(c["value"])}</b><h3>{text(c["label"])}</h3><p>{text(c.get("body",""))}</p></article>' for c in metrics)+'</div>'

def layout_architecture(slide):
 layers=bounded(slide['layers'],3,5,'layers')
 return '<div class="kit-layers">'+''.join('<div class="kit-layer"><h3>'+text(c['label'])+'</h3><div>'+items(bounded(c['items'],1,4,'layer items'))+'</div></div>' for c in layers)+'</div>'

def layout_comparison(slide):
 columns=bounded(slide['columns'],2,2,'comparison columns')
 return '<div class="kit-compare">'+''.join('<article><span class="kit-index">'+text(c.get('kicker',''))+'</span><h3>'+text(c['title'])+'</h3><p>'+text(c['summary'])+'</p><ul>'+items(bounded(c['bullets'],1,4,'comparison bullets'),'li')+'</ul></article>' for c in columns)+'</div>'

def layout_table(slide):
 headers=bounded(slide['headers'],2,6,'table columns'); rows=bounded(slide['rows'],1,12,'table rows')
 for row in rows:
  if len(row)!=len(headers):raise ValueError('Every table row must match the header count')
 note=('<div class="kit-note">'+text(slide['note'])+'</div>') if slide.get('note') else ''
 table=('<div class="kit-table-scroll"><table class="kit-table"><thead><tr>'+items(headers,'th')+'</tr></thead><tbody>'
  +''.join('<tr>'+items(row,'td')+'</tr>' for row in rows)+'</tbody></table></div>')
 return table+note

def layout_timeline(slide):
 events=bounded(slide['events'],2,8,'timeline events')
 parts=[]
 for i,event in enumerate(events):
  parts.append(
   f'<article data-timeline-step="{i}"><div class="kit-timeline-when">{text(event["when"])}</div>'
   f'<div><h3>{text(event["title"])}</h3><p>{text(event.get("body",""))}</p></div></article>'
  )
 return '<div class="kit-timeline">'+''.join(parts)+'</div>'

def layout_callouts(slide):
 items_data=bounded(slide['items'],2,4,'callouts')
 tones={'info','warn','accent'}
 parts=[]
 for i,item in enumerate(items_data):
  tone=item.get('tone','info')
  if tone not in tones:raise ValueError('Callout tone must be info, warn, or accent')
  parts.append(
   f'<article class="kit-callout" data-callout-tone="{tone}"><span class="kit-index">{i+1:02}</span>'
   f'<h3>{text(item["title"])}</h3><p>{text(item["body"])}</p></article>'
  )
 return '<div class="kit-callouts">'+''.join(parts)+'</div>'

def layout_workflow(slide):
 steps=bounded(slide['steps'],3,5,'workflow steps')
 return '<div class="kit-toolbar"><span data-flow-status>自动演示</span><div><button data-flow-play>暂停</button><button data-flow-replay>重播</button><button data-flow-all>完整示意</button></div></div><div class="kit-flow">'+''.join(f'<article data-flow-step="{i}"><span class="kit-index">{i+1:02}</span><h3>{text(c["title"])}</h3><p>{text(c["body"])}</p></article>' for i,c in enumerate(steps))+'</div><div class="kit-note">'+text(slide.get('result',''))+'</div>'

def layout_image(slide):
 path=slide['image']
 if not re.fullmatch(r'assets/[A-Za-z0-9_-]+\.(png|jpg|jpeg|svg|webp)',path):raise ValueError('Image must be a local assets/file.ext')
 if not (ROOT/path).is_file():raise ValueError('Missing image: '+path)
 return '<div class="kit-image"><img src="'+text(path)+'" alt="'+text(slide.get('alt',''))+'"><aside><h3>'+text(slide['caption'])+'</h3><p>'+text(slide.get('body',''))+'</p></aside></div>'

def layout_custom(slide):
 # The agent owns these local HTML fragments. Keep input strings out of executable code.
 fragment=slide['fragment']
 if not re.fullmatch(r'content/[A-Za-z0-9_-]+\.html',fragment):raise ValueError('Custom fragment must be content/name.html')
 for zh,en in slide.get('translations',{}).items():source({'zh':zh,'en':en})
 html_fragment=(ROOT/fragment).read_text(encoding='utf-8')
 # Reject obvious executable injection in agent-authored fragments.
 if re.search(r'<\s*script\b|on[a-z]+\s*=|javascript:',html_fragment,re.I):
  raise ValueError('Custom fragment may not include <script>, inline event handlers, or javascript: URLs')
 return html_fragment

def layout_pricing(slide):
 rows=bounded(slide['rows'],1,8,'pricing rows')
 labels=slide.get('labels',{})
 payload=[]
 for row in rows:
  entry={'name':source(row['name'])}
  for key in ('input','cacheInput','output'):
   if key in row and row[key] is not None:entry[key]=source(row[key])
  payload.append(entry)
 label_map={k:source(v) for k,v in labels.items()} if isinstance(labels,dict) else {}
 return (
  '<div class="kit-pricing" data-pricing-root '
  f'data-pricing-rows="{html.escape(json.dumps(payload,ensure_ascii=False),quote=True)}" '
  f'data-pricing-labels="{html.escape(json.dumps(label_map,ensure_ascii=False),quote=True)}"></div>'
 )

def layout_scenarios(slide):
 scenarios=bounded(slide['scenarios'],2,6,'scenarios')
 buttons,panels=[],[]
 for i,item in enumerate(scenarios):
  key=item.get('id') or f'scenario-{i+1}'
  if not re.fullmatch(r'[a-z][a-z0-9-]{0,62}',key):raise ValueError('Scenario id must be a lowercase slug')
  label=text(item['label'])
  buttons.append(f'<button type="button" data-ops-choice="{html.escape(key,quote=True)}" aria-pressed="false">{label}</button>')
  body_html='<p>'+text(item['body'])+'</p>'
  if item.get('bullets'):
   body_html+='<ul>'+items(bounded(item['bullets'],1,4,'scenario bullets'),'li')+'</ul>'
  panels.append(f'<article data-ops-panel="{html.escape(key,quote=True)}" hidden>{body_html}</article>')
 return '<div class="recipe-scenarios" data-controller="scenarios"><nav aria-label="场景切换">'+''.join(buttons)+'</nav><div>'+''.join(panels)+'</div></div>'

def layout_agenda(slide):
 agenda_items=bounded(slide['items'],2,8,'agenda items')
 parts=[]
 for i,item in enumerate(agenda_items):
  time_html=f'<span class="kit-agenda-time">{text(item["time"])}</span>' if item.get('time') else ''
  parts.append(
   f'<li class="kit-agenda-item"><span class="kit-index">{i+1:02}</span>'
   f'<span class="kit-agenda-label">{text(item["label"])}</span>{time_html}</li>'
  )
 return '<ol class="kit-agenda">'+''.join(parts)+'</ol>'

def layout_quote(slide):
 attribution=f'<footer class="kit-quote-attr"><cite>{text(slide["attribution"])}</cite>'
 if slide.get('role'):
  attribution+=f'<span class="kit-quote-role">{text(slide["role"])}</span>'
 attribution+='</footer>'
 return f'<blockquote class="kit-quote"><p>{text(slide["quote"])}</p>{attribution}</blockquote>'

def layout_tabs(slide):
 tabs=bounded(slide['tabs'],2,5,'tabs')
 buttons,panels=[],[]
 for i,item in enumerate(tabs):
  key=item.get('id') or f'tab-{i+1}'
  if not re.fullmatch(r'[a-z][a-z0-9-]{0,62}',key):raise ValueError('Tab id must be a lowercase slug')
  label=text(item['label'])
  selected='true' if i==0 else 'false'
  hidden='' if i==0 else ' hidden'
  buttons.append(
   f'<button type="button" role="tab" id="tab-{html.escape(key,quote=True)}" '
   f'data-tab-choice="{html.escape(key,quote=True)}" aria-selected="{selected}" '
   f'aria-controls="panel-{html.escape(key,quote=True)}">{label}</button>'
  )
  body_html='<p>'+text(item['body'])+'</p>'
  if item.get('bullets'):
   body_html+='<ul>'+items(bounded(item['bullets'],1,4,'tab bullets'),'li')+'</ul>'
  panels.append(
   f'<article role="tabpanel" id="panel-{html.escape(key,quote=True)}" '
   f'data-tab-panel="{html.escape(key,quote=True)}" aria-labelledby="tab-{html.escape(key,quote=True)}"{hidden}>'
   f'{body_html}</article>'
  )
 return (
  '<div class="kit-tabs" data-tabs-root data-controller="tabs">'
  '<div class="kit-tabs-list" role="tablist" aria-label="页签切换">'+''.join(buttons)+'</div>'
  '<div class="kit-tabs-panels">'+''.join(panels)+'</div></div>'
 )

def layout_cover(slide):
 backgrounds={'原山景':'assets/mountains.jpg','云山':'assets/yunshan.png','金沙':'assets/jinsha.png'}
 background=slide.get('background','原山景')
 if background not in backgrounds:raise ValueError('Unknown cover background: '+background)
 image=backgrounds[background]
 title=text(slide['title'])
 header=f'<header class="slide-header"><img class="brand" src="assets/huawei-logo.png" alt="HUAWEI"><span>{text(D.get("brandLabel","HUAWEI CLOUD"))}</span></header>'
 return (
  header+f'<div class="cover-landscape" style="background-image:linear-gradient(180deg,#f7f9fc 0%,#f7f9fcbd 18%,#f7f9fc00 43%),url(&quot;{image}&quot;)"></div>'
  f'<div class="cover-copy"><div class="eyebrow"><span class="red-rule"></span>{text(slide.get("eyebrow","PRODUCT BRIEFING"))}</div>'
  f'<h1>{title}</h1><p class="cover-subtitle">{text(slide.get("subtitle",""))}</p><div class="cover-line"></div>'
  f'<p class="cover-english">{text(slide.get("tagline","HUAWEI CLOUD"))}</p></div>'
  f'<div class="cover-bottom"><span>PRODUCT BRIEFING</span><span>{text(D.get("brandLabel","HUAWEI CLOUD"))}</span></div>'
 )

def layout_closing(slide):
 thanks=slide.get('thanks',{'zh':'','en':'Thank You'})
 vision=slide.get('vision',{'zh':'把数字世界带入每个人、每个家庭、\n每个组织，构建万物互联的智能世界。','en':'Bring digital to every person, home and organization\nfor a fully connected, intelligent world.'})
 for value in [thanks,vision]:
  if not isinstance(value,dict) or set(value)!={'zh','en'} or not all(isinstance(v,str) for v in value.values()):
   raise ValueError('Closing copy requires simultaneous zh/en strings')
 logo=slide.get('logo','assets/huawei-logo.png')
 if not isinstance(logo,str) or not re.fullmatch(r'assets/[A-Za-z0-9_-]+\.(png|jpg|jpeg|svg|webp)',logo) or not (ROOT/logo).is_file():
  raise ValueError('Closing logo must be an existing local assets/file.ext')
 motion=slide.get('motion','fade')
 if motion not in {'fade','none'}:raise ValueError('Closing motion must be fade or none')
 secondary=f'<p lang="zh-CN">{text(thanks["zh"])}</p>' if thanks['zh'] else ''
 vision_label=f'<div class="closing-vision-label">{text(slide["visionLabel"])}</div>' if slide.get('visionLabel') else ''
 return (
  f'<div class="closing-layout" data-no-translate data-closing-motion="{motion}">'
  f'<div class="closing-greeting"><h1 lang="en">{text(thanks["en"])}</h1>{secondary}</div>'
  f'<div class="closing-vision">{vision_label}'
  f'<p class="closing-vision-zh" lang="zh-CN">{text(vision["zh"])}</p>'
  f'<p class="closing-vision-en" lang="en">{text(vision["en"])}</p>'
  f'<img class="closing-logo" src="{text(logo)}" alt="{text(slide.get("logoAlt","HUAWEI"))}"></div></div>'
 )

for _kind,_fn in (
 ('cards',layout_cards),
 ('metrics',layout_metrics),
 ('architecture',layout_architecture),
 ('comparison',layout_comparison),
 ('table',layout_table),
 ('timeline',layout_timeline),
 ('callouts',layout_callouts),
 ('workflow',layout_workflow),
 ('image',layout_image),
 ('custom',layout_custom),
 ('pricing',layout_pricing),
 ('scenarios',layout_scenarios),
 ('agenda',layout_agenda),
 ('quote',layout_quote),
 ('tabs',layout_tabs),
):
 register_layout(_kind,_fn)

register_full_slide('cover','cover',layout_cover)
register_full_slide('closing','closing-slide',layout_closing)

def body(slide):
 kind=slide['type']
 if kind not in LAYOUTS:raise ValueError('Unknown slide type: '+kind)
 if kind in FULL_SLIDE:raise ValueError('Full-slide layout should not use kit body(): '+kind)
 return LAYOUTS[kind](slide)

if not re.fullmatch(r'[a-z][a-z0-9-]{2,62}',D['id']):raise ValueError('id must be a unique lowercase project slug, 3–63 characters')
if not D.get('slides'):raise ValueError('At least one slide is required')
runtime_version=D.get('runtimeVersion',TEMPLATE_RUNTIME_VERSION)
if not isinstance(runtime_version,str) or not re.fullmatch(r'\d+\.\d+\.\d+[a-zA-Z0-9.+-]*',runtime_version):
 raise ValueError('runtimeVersion must be a semver-like string')

# Persist generated identities so a page remains the same after rename, reorder or insertion.
assigned_ids=False
seen_ids=set()
for slide in D['slides']:
 if 'id' not in slide:
  slide['id']='slide-'+uuid.uuid4().hex[:12];assigned_ids=True
 slide_id=slide['id']
 if not isinstance(slide_id,str) or not re.fullmatch(r'[a-z][a-z0-9-]{0,62}',slide_id):raise ValueError('Slide id must be a stable lowercase slug')
 if slide_id in seen_ids:raise ValueError('Duplicate slide id: '+slide_id)
 seen_ids.add(slide_id)

# Register deck title before exporting translations (may be bilingual).
source(D['title'])

chapters=[]
for c in D.get('chapters',[]):chapters.append({'label':source(c['label']),'section':source(c['section'])})
if len(chapters)>5:raise ValueError('Use at most five navigation chapters')
slides=[]
for i,s in enumerate(D['slides']):
 title=text(s['title']); section=text(s.get('section','开场')); n=f'{i+1:02}'
 kind=s['type']
 if kind not in LAYOUTS:raise ValueError('Unknown slide type: '+kind)
 if kind in FULL_SLIDE:
  content=LAYOUTS[kind](s)
  cls=FULL_SLIDE[kind]
 else:
  header=f'<header class="slide-header"><img class="brand" src="assets/huawei-logo.png" alt="HUAWEI"><span>{text(D.get("brandLabel","HUAWEI CLOUD"))}</span></header>'
  content=header+f'<div class="heading"><div class="eyebrow">{text(s.get("eyebrow","PRODUCT CAPABILITIES"))}</div><h2>{title}</h2><p>{text(s.get("subtitle",""))}</p></div><div class="kit-body">'+body(s)+'</div>'+f'<footer class="slide-footer"><span>{text(s.get("footer",D.get("footer","HUAWEI CLOUD")))}</span><span>{n}</span></footer>'
  cls='kit-slide'
 notes_attr=(' data-notes="'+text(s['notes'])+'"') if s.get('notes') else ''
 slides.append(f'<section class="slide {cls}{" active" if i==0 else ""}" data-slide-id="{text(s["id"])}" data-title="{title}" data-section="{section}"{notes_attr} aria-label="第 {i+1} 页：{title}">{content}</section>')

cuts={}
for name,preset in (D.get('cuts') or {}).items():
 if not re.fullmatch(r'[a-z][a-z0-9-]{0,31}',name):raise ValueError('Cut name must be a lowercase slug: '+str(name))
 if not isinstance(preset,dict) or not isinstance(preset.get('hidden'),list):
  raise ValueError('Each cut requires { "hidden": [slideId, ...] }')
 hidden=[]
 for slide_id in preset['hidden']:
  if slide_id not in seen_ids:raise ValueError(f'Cut "{name}" references unknown slide id: {slide_id}')
  hidden.append(slide_id)
 cuts[name]={'hidden':hidden,'label':source(preset['label']) if 'label' in preset else name}

needed_scripts=['js/config.js','js/navigation.js','js/app.js','js/translations.js','js/language.js','js/scenes.js']
needed_styles=['css/styles.css','css/components.css','css/english.css']
types={s['type'] for s in D['slides']}
if 'pricing' in types:
 needed_scripts.append('js/pricing-table.js'); needed_scripts.append('js/pricing-boot.js')
 if 'css/recipes.css' not in needed_styles:needed_styles.append('css/recipes.css')
if 'scenarios' in types:
 needed_scripts.append('js/scenario-switcher.js')
 if 'css/recipes.css' not in needed_styles:needed_styles.append('css/recipes.css')
if 'tabs' in types:
 needed_scripts.append('js/tabs.js')
 if 'css/recipes.css' not in needed_styles:needed_styles.append('css/recipes.css')

config={'id':D['id'],'chapters':chapters,'runtimeVersion':runtime_version,'cuts':cuts}
(ROOT/'js/config.js').write_text('window.DeckConfig = '+json.dumps(config,ensure_ascii=False)+';\n',encoding='utf-8')
manifest={'runtimeVersion':runtime_version,'css':needed_styles,'js':needed_scripts}
(ROOT/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
style_tags=''.join(f'<link rel="stylesheet" href="{href}">' for href in needed_styles)
script_tags=''.join(f'<script defer src="{src}"></script>' for src in needed_scripts)
shell=(ROOT/'content/shell.html').read_text(encoding='utf-8')
shell=shell.replace('{{TITLE}}',text(D['title'])).replace('{{SLIDES}}','\n'.join(slides))
shell=shell.replace('{{STYLES}}',style_tags).replace('{{SCRIPTS}}',script_tags)
# Single write after all bilingual strings (including title) are registered.
(ROOT/'js/translations.js').write_text('window.DeckEnglish = '+json.dumps(translations,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'index.html').write_text(shell,encoding='utf-8')
if assigned_ids:(ROOT/'content/deck.json').write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(slides)} slides for {D["id"]} (runtime {runtime_version})')
