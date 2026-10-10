# OpenViking 使用规则

项目：refund-demo
版本线：default

1. 回答本项目的业务规则、接口行为和功能状态时，实际调用 OpenViking MCP。
2. 用户明确指定环境时，使用指定环境；未指定时，读取当前 Git 分支：
   - release → viking://resources/refund-demo/default/formal/
   - snapshot → viking://resources/refund-demo/default/testing/
   - dev → viking://resources/refund-demo/default/development/
3. 其他分支或 detached HEAD 没有默认映射，先询问目标环境，不根据分支名猜测。
4. 优先使用 find，并明确传入 target_uri。
   使用 search 时必须选择 mode="list" 并传入 target_uri。
5. 只读取选定目录内的命中文件，并引用完整 viking:// URI。
   用户要求比较环境时，分别检索各环境，分别标注来源。
6. 无结果或工具失败时明确说明，不能扩大到全局搜索或用其他环境补答案。
7. 区分已实现、待办和提议；分支资料不能单独证明实际部署状态。
