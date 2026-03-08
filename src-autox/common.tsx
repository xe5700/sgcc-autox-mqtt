// 配置文件路径
const CONFIG_FILE = `${files.cwd()}/mqtt_config.json`

// 默认配置
const DEFAULT_CONFIG = {
  host: '192.168.1.2:1883',
  username: 'user',
  password: '',
  topic_prefix: 'autox-sgcc-mqtt',
  accept_x: '815',
  accept_y: '2188',
}

// 仿真随机带曲线滑动
// qx, qy, zx, zy, time 代表起点x,起点y,终点x,终点y,过程耗时单位毫秒
// 参考链接：https://blog.csdn.net/qq_40259641/article/details/104263853
function bezier_curves(cp, t): any {
  const cx = 3.0 * (cp[1].x - cp[0].x)
  const bx = 3.0 * (cp[2].x - cp[1].x) - cx
  const ax = cp[3].x - cp[0].x - cx - bx
  const cy = 3.0 * (cp[1].y - cp[0].y)
  const by = 3.0 * (cp[2].y - cp[1].y) - cy
  const ay = cp[3].y - cp[0].y - cy - by

  const tSquared = t * t
  const tCubed = tSquared * t
  const result = {
    x: 0,
    y: 0,
  }
  result.x = ax * tCubed + bx * tSquared + cx * t + cp[0].x
  result.y = ay * tCubed + by * tSquared + cy * t + cp[0].y
  return result
}
function sml_mov(qx, qy, zx, zy, time) {
  const xxy = [time]
  let point = []
  const dx0 = {
    x: qx,
    y: qy,
  }

  const dx1 = {
    x: random(qx - 100, qx + 100),
    y: random(qy, qy + 50),
  }
  const dx2 = {
    x: random(zx - 100, zx + 100),
    y: random(zy, zy + 50),
  }
  const dx3 = {
    x: zx,
    y: zy,
  }
  point = [dx0, dx1, dx2, dx3]
  // for (let dx in dxs) {
  //     point.push(dx)
  //     // eval("point.push(dx" + i + ")")

  // };
  // log(point[3].x)

  for (let i = 0; i < 1; i = i + 0.08) {
    // @ts-except-error
    const xxyy = [Number.parseInt(bezier_curves(point, i).x), Number.parseInt(bezier_curves(point, i).y)]
    // @ts-except-error
    xxy.push(xxyy)
  }
  // @ts-except-error
  gesture.apply(...xxy)
}

// 读取配置
function loadConfig() {
  try {
    if (files.exists(CONFIG_FILE)) {
      const content = files.read(CONFIG_FILE)
      const config = JSON.parse(content)
      toastLog('配置加载成功')
      return { ...DEFAULT_CONFIG, ...config }
    }
  } catch (e) {
    toastLog(`读取配置失败: ${e}`)
  }
  return DEFAULT_CONFIG
}

// 保存配置
function saveConfig(config) {
  try {
    files.write(CONFIG_FILE, JSON.stringify(config, null, 2))
    toastLog('配置保存成功')
    return true
  } catch (e) {
    toastLog(`保存配置失败: ${e}`)
    return false
  }
}

function 创建GKD快照() {
  app.startService({
    className: 'li.songe.gkd.service.SnapshotActionService',
    packageName: 'li.songe.gkd',
  })
}
function autoApplyRequest(config) {
  auto()
  threads.start(() => {
    sleep(3000)
    console.log(`配置文件 ${JSON.stringify(config)}`)
    // text="要使用Autox.js v6截屏、录屏或投屏吗？" name="android.widget.TextView" id="android:id/alertTitle"
    console.log('开始查找申请权限的申请权限窗口')
    if (text('要使用Autox.js v6截屏、录屏或投屏吗？').findOne(5000)) {
      console.log('找到窗口')
      // text="立即开始" name="android.widget.Button"
      // id="android:id/button1"
      // 适配三星zflip4设备
      // text="立即开始"
      if (text('立即开始').findOne(500)) {
        const btn = text('立即开始').findOne(2000)
        if (btn) {
          console.log('点击立即开始')
          click(btn.bounds().centerX(), btn.bounds().centerY())
          console.log(`已点击坐标 ${btn.bounds().centerX()} ${btn.bounds().centerY()}`)
        }
      } else if (text('允许').findOne(500)) {
        const btn = text('允许').findOne(500)
        if (btn) {
          console.log('点击允许')
          click(btn.bounds().centerX(), btn.bounds().centerY())
          console.log(`已点击坐标 ${btn.bounds().centerX()} ${btn.bounds().centerY()}`)
        }
      } else {
        // 固定坐标，适用于无法获得位置的设备。
        console.log('未找到窗口，使用固定坐标')
        click(Number.parseInt(config.accept_x), Number.parseInt(config.accept_y))
        console.log(`已点击坐标 ${config.accept_x} ${config.accept_y}`)
      }
    } else {
      // 固定等待时间
      //   console.log("未找到窗口，使用固定坐标");
      // sleep(3000);
      // click(parseInt(config.accept_x), parseInt(config.accept_y));
      //     console.log("已点击坐标 " + config.accept_x + " " + config.accept_y);
    }
  })
  const req = requestScreenCapture()
  if (req) {
    console.log('已获取截屏权限')
  } else {
    console.log('未获取截屏权限')
  }
}

function getDaysInCurrentMonth(): number {
  const date = new Date()
  // 先将月份设置为下个月
  date.setMonth(date.getMonth() + 1)
  // 再将日期设置为 0，即回退到当前月的最后一天
  date.setDate(0)
  return date.getDate()
}

export { autoApplyRequest, getDaysInCurrentMonth, loadConfig, saveConfig, sml_mov, 创建GKD快照 }
