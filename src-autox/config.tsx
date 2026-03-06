'ui'
// import CloneDeep from 'lodash.clonedeep'
// import { AutojsWebRuntime } from '../src-runtime/runtime-autojs'
// import { init_native_ui } from './native-ui-demo'
// // import { JianGuoYunUtil } from './utils/jian-guo-yun-util'
// // import { SQLiteUtil } from './utils/sqlite-util'
// // import { get_date_now, get_date_now_2 } from './utils/util'

// // autojs-todo-web-ip 与 autojs-todo-web-type 是标志位，
// // 无需修改，编译时会根据环境替换为 正确的地址 和 类型
// const g_web_url = 'autojs-todo-web-url'
// const g_web_type: any = 'autojs-todo-web-type'

// ui.layout(
//   <>
//     <vertical padding="16" spacing="8">
//       <text text="MQTT 服务器配置" textSize="18" gravity="center" margin="16" />
//       <input id="mqtt_host" hint="MQTT 服务器地址 (如: mqtt://broker.hivemq.com)" margin="8" />
//       <input id="mqtt_username" hint="用户名" margin="8" />
//       <input id="mqtt_password" hint="密码" margin="8" password="true" />
//       <button id="mqtt_save" text="保存" margin="8" />
//     </vertical>
//   </>,
// )

// 如果 原生 ui 中没有用到 webview 就不需要这个类了
// const web_runtime = new AutojsWebRuntime()

// ui.btn_native_ui.click(async () => {
//   // 创建 原生 ui
//   init_native_ui()
//   // 初始化 web
//   web_runtime.init_web_view_ui(g_web_url, g_web_type, ui.web)
// })

// ui.btn_web_ui.click(() => {
//   // 纯 web 项目 (内部会自动创建一个 webview)
//   web_runtime.init_web_view_ui(g_web_url, g_web_type)
// })

// // 打开 aj 自带的日志界面
// web_runtime.on('show_log_window', () => {
//   app.startActivity('console')
// })

// // 打开 aj 自带的设置界面
// web_runtime.on('show_settings_window', () => {
//   app.startActivity('settings')
// })

// // 无参数，无返回值
// web_runtime.on('aj_fn_0', () => {
//   console.log('aj_fn_0 被 web 调用')
// })

// // 返回 number
// web_runtime.on('aj_fn_1', () => {
//   console.log('aj_fn_1 被 web 调用')
//   return 1
// })

// // 接收一个参数，并返回 boolean
// web_runtime.on('aj_fn_2', (name) => {
//   console.log('aj_fn_2 被 web 调用:name-> %s', name)
//   return true
// })

// // 返回值 string
// web_runtime.on('aj_fn_3', () => {
//   return '我是字符串'
// })

// // async 异步函数
// // 接收多个参数 并 调用 web 的一个函数
// // 通过 babel 支持 async 和 await
// web_runtime.on('aj_fn_4', async (id: number, name: string, age: number) => {
//   console.log('aj_fn_4 被 web 调用:id-> %s, name-> %s, age-> %s', id, name, age)

//   // 测试 aj 调用 web
//   const data = await web_runtime.call_web_js_async(`test_aj_call_web(['返回值 1', '返回值 2', '返回值 3'])`)

//   console.log(' AJ 接收到 test_aj_call_web 的返回值 :', data)

//   const ret = [
//     { id: 1, name: '小明 1' },
//     { id: 2, name: '小明 2' },
//     { id: 3, name: '小明 3' },
//   ]

//   return ret
// })

// interface IFn5Props {
//   id: number | undefined
//   name: string
// }

// // 接收 js 对象
// web_runtime.on('aj_fn_5', (data: IFn5Props) => {
//   console.log(`${data.id} --- ${data.name}`)
//   console.log('lodash:', CloneDeep(data)?.id)
//   return true
// })
import { loadConfig, saveConfig } from './common'
import { publishSgccData, run } from './sgcc'
// import { JianGuoYunUtil } from './utils/jian-guo-yun-util'
// import { SQLiteUtil } from './utils/sqlite-util'
// import { get_date_now, get_date_now_2 } from './utils/util'

// autojs-todo-web-ip 与 autojs-todo-web-type 是标志位，
// 无需修改，编译时会根据环境替换为 正确的地址 和 类型
const g_web_url = 'autojs-todo-web-url'
const g_web_type: any = 'autojs-todo-web-type'

// 加载配置到 UI
function loadConfigToUI() {
  const config = loadConfig()
  ui.mqtt_host.setText(config.host || '192.168.1.2:1883')
  ui.mqtt_username.setText(config.username || '')
  ui.mqtt_password.setText(config.password || '')
  ui.accept_x.setText(config.accept_x || '815')
  ui.accept_y.setText(config.accept_y || '2188')
  ui.topic_prefix.setText(config.topic_prefix || 'autox-sgcc-mqtt')
}

// 从 UI 获取配置
function getConfigFromUI() {
  return {
    host: ui.mqtt_host.text(),
    username: ui.mqtt_username.text(),
    password: ui.mqtt_password.text(),
    accept_x: ui.accept_x.text(),
    accept_y: ui.accept_y.text(),
    topic_prefix: ui.topic_prefix.text(),
  }
}

ui.layout(
  <>
    <vertical
      padding="16"
      spacing="8"
    >
      <text
        text="MQTT 服务器配置"
        textSize="18"
        gravity="center"
        margin="16"
      />
      <input
        id="mqtt_host"
        hint="MQTT 服务器地址 (如: mqtt://broker.hivemq.com)"
        margin="8"
      />
      <input
        id="mqtt_username"
        hint="用户名"
        margin="8"
      />
      <input
        id="mqtt_password"
        hint="密码"
        margin="8"
      />
      <input
        id="topic_prefix"
        hint="主题前缀"
        margin="8"
      />
      <text margin="8">同意录屏权限的坐标</text>
      <input
        id="accept_x"
        hint="X"
        margin="4"
      />
      <input
        id="accept_y"
        text="Y"
        margin="4"
      />
      <button
        id="mqtt_save"
        text="保存"
        margin="8"
      />
      <button
        id="start_sign"
        margin="8"
      >
        开始签到
      </button>
      <button
        id="query_data"
        margin="8"
      >
        获取数据到MQTT
      </button>
    </vertical>
  </>,
)

// 启动时加载配置
ui.post(() => {
  loadConfigToUI()
}, 500)

// 保存按钮点击事件
ui.mqtt_save.click(() => {
  const config = getConfigFromUI()

  // 简单验证
  if (!config.host) {
    toast('请输入 MQTT 服务器地址')
    return
  }

  saveConfig(config)
})

// 开始签到
ui.start_sign.click(() => {
  // run();
  threads.start(() => run())
})

// 获取数据按钮点击事件
ui.query_data.click(() => {
  threads.start(() => {
    try {
      publishSgccData()
    } catch (e) {
      toast('获取数据失败')
      console.error(e)
    }
  })
  // queryData();
})

// 导出配置相关函数供其他模块使用
// export { loadConfig, saveConfig, getConfigFromUI }
