---
name: huawei-product-slides
description: Create or update Huawei-branded bilingual HTML decks (product briefing, status/weekly report, design review, project report, workshop) using the bundled 16:9 canvas, layouts, presenter tools (laser/marker), PIN hosting and Cloudflare deploy. Use for Huawei-style slides or editable PPTX export from deck.json.
---

# 华为 HTML→PPT 演示制作

用户提供内容，你负责选择**文稿类型（archetype）**、组织页面、填充组件、检查双语排版、构建交付和按用户授权发布。默认复用这里的设计和基础代码。产物是可交互 HTML 演示、单文件离线 HTML、可打印 PDF、可部署项目；**可编辑 PPTX** 是一等公民导出选项：`npm run export:pptx -- --lang zh`（软依赖 `pip install python-pptx`；**交互 SoR 仍是 HTML**）。

支持的文稿类型（`deck.kind`，可省略，默认按产品简报姿态）：`product-briefing` · `status-report` · `design-review` · `project-report` · `workshop`。布局选用见 [archetype 指南](assets/recipes/deck-archetypes/README.md)。

## 工作方式

1. 第一次使用时告诉用户正在使用本 skill。读取 [设计规范](references/design.md)、[内容与组件](references/content-and-components.md)。需要发布时再读 [部署流程](references/deployment.md)。
2. 从上下文推断文稿类型、受众、核心信息、语言和现有素材。能合理推断就继续，不要要求用户配置 CSS、组件或构建。内容不完整时先做明确占位的草稿，不编造价格、指标、可用性或功能。
3. 新项目使用独立目录和唯一项目 ID。执行 `python3 <skill根目录>/scripts/init.py <新项目目录> --id <唯一slug> --title <标题> --starter blank|status-report|design-review|examples`。`blank`＝产品简报弧线；`status-report`＝周报/状态；`design-review`＝方案评审；`examples`＝模板组件样例。更新已有项目用 `python3 <skill根目录>/scripts/sync_runtime.py <项目目录>`。
4. 主要修改 `content/deck.json`（契约见 `assets/template/schemas/deck.schema.json`）。可设 `kind` 与 `meta.purpose`；每页一个重点；按 archetype 选布局（`timeline` / `callouts` / `before-after` / `agenda` / `table` / `pricing` / `scenarios` 等）。生成文件 `index.html`、`js/config.js`、`js/translations.js`、`asset-manifest.json` 会重建，业务内容不要写进去。
5. 中英文用 `{ "zh": "中文", "en": "English" }`。可选 `notes`；`?presenter=1` 或 `N` 打开备注。演示笔：`L` 激光、`P`/`D` 马克笔、`B` 编号标记、`E` 橡皮、`⇧E` 清除本页、`Esc` 退出工具（`?` 对照表；右侧悬停工具栏并行）。
6. 从模板组件开始；`custom` 片段禁止 script/内联事件。价格与指标写入 `docs/content-sources.md`。
7. 执行 `npm run build` 和 `npm test`；需要时 `npm run test:browser`。默认不导出。用户明确要求时：`npm run export:html`、`npm run export:pdf -- --lang zh`、**`npm run export:pptx -- --lang zh`**（缺 `python-pptx` 时按提示安装一次）。
8. 交付末尾可提示可再导出单文件 HTML / PDF / **可编辑 PPTX**；无明确要求不自动导出或部署。

## 设计默认值

- 华为 Logo 使用 `assets/template/assets/huawei-logo.png` 原图，保留比例，禁止重绘或变形。
- 可选封面：云山（层叠山脊与云海）、金沙（沙丘远山），在 cover 页的 background 字段选择。
- 1600×900 / 16:9，白底、华为红 `#c7000b`、深灰正文、细灰分割线，左右 84px 留白。
- 页头品牌与章节、标题/副标题、正文、页脚；控制条鼠标靠近底部或键盘操作时出现。
- 默认 2–4 张卡片、3–5 层架构、2 列比较、3–5 个流程节点。内容密集就拆页。
- 动效用于说明流程与因果。默认淡入和逐步高亮；不自动翻页，不自动轮换阅读中的场景，不增加复杂装饰动画。
- 可选致谢页使用 closing 布局：纯白背景，左侧大号 Thank You，右侧双语愿景及较大 Huawei Logo；默认不显示中文致谢和愿景小标题；两种语言同时显示，默认不加页头页脚。配置参考 assets/starters/thank-you.json；完整产品演示默认以此收尾，用户另有结束页要求时按其要求。
- 新产品图标由当前项目提供；包内只保存通用品牌与封面素材。
- 用户是官方演示者时，不擅自添加“公开价格/核对日期/实际以购买页面为准”等模板声明。来源和核对日期写在内部 `docs/content-sources.md`，只保留用户需要呈现的规则、单位和适用范围。

## 输入与输出

用户可以直接给自然语言内容，不必自己填写 JSON。例如：

> 使用 $huawei-product-slides，介绍华为云的新产品 X，面向企业客户。内容包括定位、三项优势、架构、套餐、一个业务案例和 Demo。中英双语，沿用华为风格，部署到一个新的 Cloudflare 项目。

你将这些内容整理成 deck.json，生成并检查演示。导出交付使用项目内现成 CLI，不为每次导出重写脚本。常规页面只修改内容；新颖图示或真实 API Demo 可以扩展组件，同时保持公共交互和品牌规范。

交付时简要说明输出位置、页数、检查结果及已发布的地址。若只有构建产物，明确说明尚未发布。安装技能的方法和目录结构见 [README](README.md)。
