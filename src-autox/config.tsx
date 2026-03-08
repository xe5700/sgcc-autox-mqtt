// // import { JianGuoYunUtil } from './utils/jian-guo-yun-util'
// // import { SQLiteUtil } from './utils/sqlite-util'
// // import { get_date_now, get_date_now_2 } from './utils/util'

// // autojs-todo-web-ip 与 autojs-todo-web-type 是标志位，
// // 无需修改，编译时会根据环境替换为 正确的地址 和 类型
import { loadConfig, saveConfig } from './common'
import { publishSgccData, run, startApp, test } from './sgcc'

const g_web_url = 'autojs-todo-web-url'
const g_web_type: any = 'autojs-todo-web-type'
// import { SQLiteUtil } from './utils/sqlite-util'
// import { get_date_now, get_date_now_2 } from './utils/util'

// autojs-todo-web-ip 与 autojs-todo-web-type 是标志位，
// 无需修改，编译时会根据环境替换为 正确的地址 和 类型
// const g_web_url = 'autojs-todo-web-url'
// const g_web_type: any = 'autojs-todo-web-type'

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
      <button
        id="debug"
        margin="8"
      >
        调试
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

ui.debug.click(() => {
  threads.start(() => {
    try {
      startApp()
      sleep(3000)
      test()
    } catch (e) {
      toast('获取数据失败')
      console.error(e)
    }
  })
})
// 导出配置相关函数供其他模块使用
// export { loadConfig, saveConfig, getConfigFromUI }
