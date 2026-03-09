// 定义单条日期数据的类型
export interface DailyDataItem {
  power: string
  尖: string
  峰: string
  平: string
  谷: string
}

// 定义最新数据中的详细信息类型
export interface LatestDataDetails {
  日期: string
  数据: DailyDataItem
  本月谷电: string
  本月尖电: string
  本月平电: string
  本月峰电: string
  本月总电量: string
  总用电量: string
  总电费量: string
  预计本月谷电: string
  预计本月尖电: string
  预计本月平电: string
  预计本月峰电: string
  预计本月用电量: string
  预计本月总电费: string
  年累计电量: string
  当月峰电电费: string
  当月谷电电费: string
  当月平电电费: string
  当月尖电电费: string
  当月总电费: string
  年累计电费: string
  预计本月电费: string
  预计本月分时价格差: string
}

// 定义月度电费中单个月份的信息
export interface MonthlyInfo {
  结算结果: string
  本期电费: string
  本期电量: string
}

// 定义某一年的月度电费数据
export interface YearlyMonthlyData {
  年累计电费: string
  年累计电量: string
  月份数据: Record<string, MonthlyInfo> // 使用Record来表示动态键名，如 '1月', '2月'...
}

// 定义电价价目表的类型
export interface ElectricityPriceList {
  一阶电价: number
  电价一阶: number
  谷电价一阶: number
  峰电价一阶: number
  尖电价一阶: number
  平电价一阶: number
  电价二阶: number
  谷电价二阶: number
  峰电价二阶: number
  尖电价二阶: number
  平电价二阶: number
  电价三阶: number
  谷电价三阶: number
  峰电价三阶: number
  尖电价三阶: number
  平电价三阶: number
  二阶起始: number
  三阶起始: number
  当前谷电价: number
  当前峰电价: number
  当前尖电价: number
  当前平电价: number
  当前阶梯: number
  峰谷电: boolean
  当前电价: number
}

// 主要的数据类型
export interface SgccInfoJson {
  name: string
  id: string
  地址: string
  index: number
  data: Record<string, DailyDataItem> // 使用Record来表示以日期字符串为键的动态对象，如 '2026-01-01'
  应交金额: string
  账户余额: string
  近七日累计用电量: string
  上期电量: string
  上期电费: string
  年累计电费: string
  最新数据: LatestDataDetails
  月度电费: Record<string, YearlyMonthlyData> // 使用Record来表示以年份字符串为键的动态对象，如 '2026年'
  已发行电费处于: string
  电价价目表: ElectricityPriceList
}

// SQCC设备信息
export interface DeviceInfo {
  设备列表: string[]
}

export interface MqttDeviceLatch {
  device_latch: any
  types_latch: any
  topic_prefix: string
  is_timeout: boolean
}
