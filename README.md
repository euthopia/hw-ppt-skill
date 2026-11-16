# Huawei Product Slides

**制作华为风格 HTML→PPT 文稿的 Agent Skill。** 你提供内容，Agent 负责选择文稿类型、组织章节、选择版式、生成中英双语页面、配置轻量动效、检查排版并构建交付文件；需要时导出**可编辑 PPTX**。

当前技能包 **1.5.6**（HTML 运行时 **1.5.6**）。适用于产品简报、周报/状态同步、架构设计评审、项目里程碑汇报、培训工作坊，以及方案对比、套餐说明、业务案例和 Demo。

[在线体验：封面＋空白页](https://huawei-product-slides-demo.leonguo08.workers.dev/) · [致谢页预览图](demo/thank-you-preview.png) · [变更记录](CHANGELOG.md) · [English README](README.en.md)

## 能做出什么

| 产物 | 使用方式 |
| --- | --- |
| 交互式 HTML 演示 | 浏览器打开，支持翻页、目录、语言切换与全屏 |
| 离线单文件 HTML | 图片、样式和脚本内嵌，可保存后直接打开 |
| PDF | 脚本一键导出中文、英文或两份 PDF，保留完整静态内容 |
| 可编辑 PPTX | `deck.json` → PowerPoint 友好 `.pptx`（左侧华为红强调条 + 演示备注），供需要 Office 的干系人使用 |
| 可编辑项目源码 | 内容、组件、样式和部署配置分别维护 |
| 在线演示站点 | 使用 Cloudflare Workers 或 Sites ESM Worker 发布 |

## 功能

- **品牌与排版**：华为 Logo、白底与红色强调 `#c7000b`、16:9 画布、统一页头页脚；可选择云山、金沙和山景封面。
- **版式套件**：封面、卡片、指标、分层架构、双列对比、**路径树 tree**、**组成公式 formula**、**左右对照 split**、**运营面板 panels**、**前后对照 before-after**、**可滚动粘性表头表格**、流程、图片、定价、场景、**时间线**、**要点提示**、**议程**、**引用证言**、**页签 tabs**、自定义及致谢页；可选 **summary / tag / focus**。
- **中英双语**：一键切换、英文独立样式、语言偏好记忆，支持双语目录和控件。
- **多文稿类型**：可选 `deck.kind`（`product-briefing` / `status-report` / `design-review` / `project-report` / `workshop`）与 `meta.purpose`；起始模板见下方。
- **演示工具**：键盘/触控翻页、全屏、章节跳转、缩略图目录、位置记忆、**演示备注**（`N` / `?presenter=1`）、**激光笔**（`L`）、**马克笔/橡皮**（`P`/`D`/`E`，`⇧E` 清本页）、**编号标记**（`B`，点击盖 1/2/3…）、**悬停工具栏**（右侧边缘，与快捷键并行）、**快捷键对照**（`?`）、**命名销售切片**（`?cut=cio`）。
- **屏蔽页面**：目录中选择不演示的页面并保存，翻页和章节跳转自动跳过；支持取消与恢复全部。设置按演示项目保存在当前浏览器，至少保留一页。
- **轻量动效**：方向感知翻页过渡（软裁切 + 微缩放、页头/标题分层落位、克制红线闪一下）、流程自动高亮 / 暂停 / 重播 / 完整显示；离页停止；打印、缩略图与 `prefers-reduced-motion` 下瞬时完整展示。
- **可选交互组件**：手动场景切换、输入/缓存输入/输出价格表等通用组件。
- **访问保护**：在线产品项目使用服务端 PIN 校验与登录 Cookie，保护网页和静态资源。
- **一键导出**：CLI 生成单文件 HTML、中英 PDF 与 **可编辑 PPTX**；支持指定输出目录，无需改脚本。
- **全稿预览**：浏览器检查生成每页中英文截图和两张全稿总览图，方便审阅整体排版。
- **质量检查**：双语文字溢出、正文与页脚间距、目录跳转、动效、离线资源和访问控制测试。

自定义图示和业务 Demo 可按当前项目扩展。基础 Skill 不内置特定产品的 API 控制台、模型服务或代理；部署需要对应平台授权。

## 安装

将整个仓库放入 Agent 支持的技能目录，保留 `SKILL.md` 和相对目录结构。

Codex 用户级安装示例：

```sh
git clone https://github.com/euthopia/hw-ppt-skill.git ~/.agents/skills/huawei-product-slides
```

也可安装到项目的 `.agents/skills/huawei-product-slides/`。重新载入会话后，确认 `$huawei-product-slides` 可见。

## 使用 Skill

直接向 Agent 提供内容即可：

> 使用 $huawei-product-slides，为产品 X 制作企业客户介绍。包含定位、三项优势、架构、套餐和一个业务案例。中英双语，封面用云山。

可以继续提出页面调整、动画、图片或部署要求。Agent 根据内容生成项目，并执行排版和交互检查。

## 手动创建项目

需要 Node.js 20+ 和 Python 3。基础生成与构建无需安装 npm 依赖。

在技能仓库目录执行：

```sh
python3 scripts/init.py /path/to/my-product-deck \
  --id my-product-deck \
  --title '产品 X 介绍' \
  --title-en 'Product X briefing' \
  --starter blank

# 其他文稿类型：
#   --starter status-report | design-review | project-report | workshop

cd /path/to/my-product-deck
npm run build
npm test
```

| 起始模板 | 内容 |
| --- | --- |
| `--starter blank` | 产品简报弧线：封面→议程→路径树→价值卡片→组成公式→对照矩阵→运营面板→下一步→致谢（`kind: product-briefing`） |
| `--starter status-report` | 状态周报：议程→指标→时间线→风险→行动表→致谢 |
| `--starter design-review` | 设计评审：背景→架构→前后对照→取舍→待确认项→致谢 |
| `--starter project-report` | 项目阶段汇报：指标→里程碑→交付节奏→风险→行动→致谢 |
| `--starter workshop` | 工作坊：议程→学习目标→引导流程→角色页签→讨论提示→致谢 |
| `--starter examples` | 模板组件示例，适合了解布局与流程组件 |

布局与文稿类型对照见 [`assets/recipes/deck-archetypes/README.md`](assets/recipes/deck-archetypes/README.md)。

主要编辑 `content/deck.json`（JSON Schema：`assets/template/schemas/deck.schema.json`），填入页面标题、正文及双语文本；自定义页面使用 `content/*.html`。生成器负责页码、目录、语言字典、`runtimeVersion` 和页面骨架。字段与组件示例见 [内容与组件](references/content-and-components.md)。

本地预览：

```sh
python3 -m http.server 8798 --bind 127.0.0.1
```

然后在浏览器打开 `http://127.0.0.1:8798/index.html`。

## 选择本次演示的页面

1. 打开目录，点击 **屏蔽页面**。
2. 勾选不演示的页面，点击 **保存**。
3. 需要恢复时，再进入该模式取消勾选，或点击 **恢复全部**后保存。

刷新后仍保留选择。取消、Esc 或关闭目录会放弃未保存的修改。屏蔽页保留在目录里，可随时恢复；当前浏览器打印/PDF 也会跳过它们。

选择存于浏览器本地，以项目 ID 隔离。页面有稳定 ID，调整顺序或修改标题不会改变屏蔽对象。设置不跨浏览器、设备或域名同步。

## 构建与发布

| 命令 | 输出 |
| --- | --- |
| `npm run build` | 生成用于预览的多文件网页，不导出、不生成部署产物 |
| `npm run build:offline` | `dist/offline/presentation.html` |
| `npm run build:cloudflare` | `deploy/cloudflare/dist/public/` |
| `npm run build:sites` | Sites ESM Worker |
| `npm run deploy:cloudflare` | 发布当前项目到 Cloudflare |
| `npm run test:browser` | 浏览器检查、截图与 PDF，需要 Playwright 和浏览器 |

Cloudflare 项目需要配置平台授权和 `ACCESS_PIN`。离线文件与纯静态预览可直接打开。详细步骤见 [部署流程](references/deployment.md) 和 [检查与交付](references/validation.md)。

## 一键导出，无需 Agent 改代码

制作完成后，Agent 会提示可以导出 PDF 或单文件 HTML。**只有用户明确要求导出时才执行**，默认不生成这两类文件。用户只要求一种格式时，仅导出该格式。

在生成的产品项目目录运行：

```sh
npm run export:html                    # 单个可离线打开的 HTML
npm run export:pdf -- --lang zh         # 中文 PDF
npm run export:pdf -- --lang en         # 英文 PDF
npm run export:pptx -- --lang zh        # 可编辑 PowerPoint（一等公民选项；需 python-pptx）
npm run export -- --lang both           # HTML + 中文 PDF + 英文 PDF（默认不含 PPTX）
```

**可编辑 PPTX（推荐给需要改稿的干系人）：**

```sh
pip install python-pptx
npm run export:pptx -- --lang zh
# 或：npm run export:pptx -- --lang en --output-dir dist/exports
```

从 `deck.json` 生成左侧华为红强调条、标题/副标题、表格、备注页；交互与马克笔墨迹仍以 HTML 为准。

选页导出可加 `--slides "1,3-5,thank-you"`，支持页码、范围和稳定页面 ID，按参数顺序输出并去重；HTML / PDF / PPTX 均适用，不改原稿。命名销售切片可加 `--cut cio`（读取 `deck.json` 的 `cuts.cio.hidden`）；可与 `--slides` 组合：**先按 cut 去掉隐藏页，再在剩余页上做选页**。

默认输出到 `dist/exports/`；可加 `--output-dir "目标目录"`。PDF 第一次需要安装浏览器依赖；PPTX 为可选软依赖：

```sh
npm install --no-save playwright
npx playwright install chromium
pip install python-pptx
```

后续只更新内容、执行命令即可。HTML 不需要这些 npm 依赖；PDF 导出自动起停本地服务、完整显示动效内容，并按 16:9 分页。HTML 保留双语切换与交互（交互 SoR）；PDF 是静态内容；**PPTX 从 `deck.json` 生成可编辑 Office 稿**。已有 Chromium 可用 `--browser-executable` 或 `BROWSER_EXECUTABLE` 指定。

默认 `npm run build`、`npm test` 和浏览器检查只生成或检查预览网页，不导出单文件 HTML/PDF，也不生成部署产物。导出检查通过显式的 `test:export:html`、`test:export` 执行。部署模板在初始化时提供；日常内容修改无需改动 deploy/。明确需要发布时才执行对应平台的打包和部署命令。

## 升级已有演示项目

```sh
python3 /path/to/hw-ppt-skill/scripts/sync_runtime.py /path/to/my-product-deck
cd /path/to/my-product-deck && npm run build
```

脚本会同步运行时文件、写入新的 `runtimeVersion`，并打印 `CHANGELOG.md` 中的升级 / Breaking notes。生成期可选安装 `pip install jsonschema` 以启用 `deck.schema.json` 校验。

## Demo 与目录结构

`demo/index.html` 是可直接打开的两页离线演示；`demo/thank-you.html` 为独立的通用致谢页预览。致谢页以纯白左右布局同时呈现中英文，可直接复用 `assets/starters/thank-you.json` 中的页面配置。重新生成：

```sh
python3 scripts/build-demo.py
```

内置海外销售样例：`examples/codearts-agent-intl/`、`examples/maas-token-intl/`（可直接 `npm run build` 预览）。

```text
hw-ppt-skill/
├── SKILL.md               Agent 制作流程
├── README.md              中文指南
├── README.en.md           English guide
├── CHANGELOG.md           运行时 / Skill 版本说明
├── references/            设计、内容、部署与验证说明
├── scripts/               项目初始化、Demo 构建、运行时同步
├── examples/              CodeArts / MaaS 等完整样例稿
├── assets/
│   ├── template/          完整演示项目模板（runtime 1.5.6） |
│   ├── starters/          blank · status-report · design-review ·
│   │                      project-report · workshop · thank-you
│   └── recipes/           可选交互组件 + deck-archetypes 指南
└── demo/                  可直接打开的演示与预览部署配置
```
