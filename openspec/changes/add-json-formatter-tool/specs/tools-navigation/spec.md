# Spec Delta

## Purpose

提供"工具集"分区的导航与布局骨架：让所有工具页统一挂在 `/tools` 路由下，并提供工具间切换的子导航。

## ADDED Requirements

### Requirement: 工具分区路由

系统 SHALL 提供 `/tools` 路由分区，每个工具挂载为其子路由（如 `/tools/json`），未匹配的工具路径 SHALL 进入 404 处理。

#### Scenario: 访问工具页

- **WHEN** 用户访问 `/tools/json`
- **THEN** 系统渲染工具分区布局，并在内容区展示 JSON 工具

#### Scenario: 访问不存在的工具

- **WHEN** 用户访问 `/tools/not-exist`
- **THEN** 系统进入 404 处理

### Requirement: 工具子导航

工具分区 SHALL 展示工具列表导航，当前激活的工具 MUST 有可见的高亮状态。

#### Scenario: 切换工具

- **WHEN** 用户在工具子导航中点击另一个工具
- **THEN** 内容区切换到对应工具，且该工具在导航中呈现激活状态

### Requirement: 主导航入口

站点主导航 SHALL 包含指向工具分区的入口。

#### Scenario: 从主导航进入工具区

- **WHEN** 用户点击主导航的 tools 入口
- **THEN** 系统导航到 `/tools` 下的默认工具页
