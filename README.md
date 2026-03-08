# sgcc-autox-mqtt

> 基于 Autox.js 的国家电网用电数据自动采集与 MQTT 推送工具，支持 Home Assistant 集成

## 📋 项目简介

本项目通过 Autox.js 自动化脚本，从**网上国网 APP**自动获取用电数据，包括日用电量、峰谷平尖电量、月度电费、年累计数据等，并通过 **MQTT** 协议推送到 Home Assistant 或其他 MQTT 服务器，实现用电数据的智能家居集成。

## ✨ 主要功能

- **多户号支持**：自动识别并采集多个电表户号的用电数据
- **详细用电数据**：
  - 每日用电量（尖/峰/平/谷）
  - 月度用电量统计
  - 年累计电量/电费
  - 账户余额/应交金额
- **阶梯电价计算**：支持三阶阶梯电价和峰谷电价计算
- **Home Assistant 集成**：
  - 支持 HA 自动发现（HASS Discovery）
  - 自动创建传感器实体
  - 支持电价配置控件（Number/Switch）
  - 与hassbox的实体兼容，可以使用兼容的homeassistant lovelace 展示数据。
- **MQTT 双向通信**：
  - 推送用电数据到 MQTT
  - 从 MQTT 接收电价配置更新

## 📁 项目结构

```
src-autox/
├── config.tsx          # UI 配置界面（MQTT 服务器、主题前缀等）
├── sgcc.tsx            # 核心业务逻辑（数据采集、MQTT 通信）
├── sgcc_type.tsx       # TypeScript 类型定义
├── common.tsx          # 公共工具函数
└── utils/              # 工具类模块
```

## 🔧 配置说明

### 1. MQTT 配置

在 APP 界面中配置以下参数：

| 参数 | 说明 | 示例 |
|------|------|------|
| `mqtt_host` | MQTT 服务器地址 | `mqtt://192.168.1.2:1883` |
| `mqtt_username` | MQTT 用户名 | `homeassistant` |
| `mqtt_password` | MQTT 密码 | `your_password` |
| [topic_prefix](https://github.com/xe5700/sgcc-autox-mqtt/src-autox/sgcc_type.tsx#L115-L115) | 主题前缀 | `autox-sgcc-mqtt` |
| `accept_x/y` | 录屏权限确认坐标 | `815/2188` |

### 2. Home Assistant 配置

在 `configuration.yaml` 中启用 MQTT 发现：

```yaml
mqtt:
  discovery: true
  discovery_prefix: homeassistant
```

## 📡 MQTT 主题说明

### 订阅主题（接收配置）

| 主题 | 说明 |
|------|------|
| `${topic_prefix}/device_info` | 设备列表配置 |
| `${topic_prefix}/{device_id}/{type}` | 电价参数配置 |

### 发布主题（推送数据）

| 主题 | 说明 | 数据类型 |
|------|------|----------|
| `${topic_prefix}/{device_id}` | 完整用电数据 JSON | JSON |
| `${topic_prefix}/{device_id}/total_power` | 总用电量 | String |
| `${topic_prefix}/{device_id}/month_power` | 本月总电量 | String |
| `${topic_prefix}/{device_id}/owe` | 应交金额 | String |
| `${topic_prefix}/{device_id}/balance` | 账户余额 | String |
| `${topic_prefix}/{device_id}/year_power` | 年累计电量 | String |
| `${topic_prefix}/{device_id}/year_cost` | 年累计电费 | String |
| `${topic_prefix}/{device_id}/hassbox` | HA 插件兼容数据 | JSON |

### Home Assistant 自动发现

自动创建以下传感器实体：

- `sensor.sgcc_{设备 ID}_main` - 总用电量
- `sensor.sgcc_{设备 ID}_daily_power` - 最新日用电
- `sensor.sgcc_{设备 ID}_month_power` - 本月总电量
- `sensor.sgcc_{设备 ID}_owe` - 应交金额
- `sensor.sgcc_{设备 ID}_balance` - 账户余额
- `sensor.sgcc_{设备 ID}_year_cost` - 年累计电费

## 🚀 使用方法

### 1. 环境准备

- Autox.js 运行环境 (必须使用Autox.js 运行环境，不可使用Auto.js，部分功能Auto.js 不支持.)
- 已安装**网上国网 APP**（包名：`com.sgcc.wsgw.cn`）
- MQTT 服务器（如 EMQX、Mosquitto、Home Assistant MQTT）
- Android 设备需开启**无障碍服务**，录屏权限暂时不需要。

### 2. 运行步骤

#### UI 配置
1. 在 Autox 中导入项目
2. 运行 `config.js` 或者直接运行项目，配置 MQTT 参数。
3. 点击**保存**按钮保存配置
4. 点击**获取数据到 MQTT** 开始采集
5. 在 Home Assistant 中查看自动发现的传感器

#### 单独运行
1. 运行 `sgcc_query.js` 立即开始采集数据

#### 定时采集
1. 在Autox 中创建一个计划任务，定时执行 `sgcc_query.js`


### 3. 编译方式
1. 使用pnpm 安装依赖
2. 运行 `pnpm run build` 编译项目

## 📊 数据类型定义

### 用电数据结构（[SgccInfoJson](https://github.com/xe5700/sgcc-autox-mqtt/src-autox/sgcc_type.tsx#L83-L99)）

```typescript
interface SgccInfoJson {
  name: string;           // 户名
  id: string;             // 户号
  地址：string;            // 用电地址
  data: Record<string, DailyDataItem>;  // 每日用电数据
  最新数据：LatestDataDetails;           // 最新汇总数据
  月度电费：Record<string, YearlyMonthlyData>; // 月度电费
  电价价目表：ElectricityPriceList;      // 电价配置
  // ... 其他字段
}
```

### 每日用电数据（[DailyDataItem](https://github.com/xe5700/sgcc-autox-mqtt/src-autox/sgcc_type.tsx#L1-L7)）

```typescript
interface DailyDataItem {
  power: string;  // 总用电量
  尖：string;      // 尖峰电量
  峰：string;      // 高峰电量
  平：string;      // 平段电量
  谷：string;      // 低谷电量
}
```

## ⚙️ 电价配置

支持通过 MQTT 动态配置电价参数：

| 配置项 | 主题后缀 | 说明 |
|--------|----------|------|
| 一阶电价 | `l1price` | 第一阶梯电价（无峰谷） |
| 峰电价一阶 | `l1price_feng` | 第一阶梯峰电价 |
| 谷电价一阶 | `l1price_gu` | 第一阶梯谷电价 |
| 二阶电价 | `l2price` | 第二阶梯电价（无峰谷） |
| 峰电价二阶 | `l2price_feng` | 第二阶梯峰电价 |
| 谷电价二阶 | `l2price_gu` | 第二阶梯谷电价 |
| 三阶电价 | `l3price` | 第三阶梯电价（无峰谷） |

| 二阶起始 | `l2cost_start` | 第二阶梯起始度数 |
| 三阶起始 | `l3cost_start` | 第三阶梯起始度数 |
| 峰谷电启用 | `fenggu_enable` | 是否启用峰谷电价 |

## ⚠️ 注意事项

- 首次运行需要手动授予**无障碍权限**
- 网上国网 APP 可能需要验证码登录，建议保持登录状态
- 数据采集过程中请勿操作手机，避免干扰自动化流程
- MQTT 密码以字符数组形式传输，确保服务器兼容
- 建议设置定时任务定期同步数据（如每天凌晨）

## 📝 更新日志

- 支持多户号自动识别
- 支持峰谷平尖四时段电量采集
- 支持阶梯电价自动计算
- 支持 Home Assistant 自动发现
- 支持 MQTT 双向配置同步

## 📄 许可证
GPLv3.0

## 🙏 致谢

- [Auto.js](https://github.com/hyb1996/Auto.js) - Android 自动化框架
- [Autox.js](https://github.com/autox-community/AutoX) - 跨平台自动化框架
- [Home Assistant](https://www.home-assistant.io/) - 智能家居平台
- [网上国网](https://www.sgcc.com.cn/) - 国家电网官方 APP

---

**有问题或建议？欢迎提交 Issue！**