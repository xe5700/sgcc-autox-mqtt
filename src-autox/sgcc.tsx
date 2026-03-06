import { format as format_date } from 'date-fns'
import realr from 'random'
import { autoApplyRequest, loadConfig, 创建GKD快照 } from './common'

importPackage(Packages['org.eclipse.paho.client.mqttv3'])
importClass('org.eclipse.paho.android.service.MqttAndroidClient')
const appPackageName = 'com.sgcc.wsgw.cn'
const mainActivityName = 'com.sgcc.wsgw.rnbundle.activity.HomeReactActivity'

function startApp() {
  // shell("am start " + app.intentToShell({
  //     packageName: appPackageName,
  //     className: mainActivityName
  // }), false);
  app.launch(appPackageName)
  waitForPackage(appPackageName)
}
function stopApp() {
  shell(`am force-stop ${appPackageName}`, true)
}
function skipAd() {
  const content = id('android:id/content').findOne(5000)
  const s = desc('未选定今日不再出现').findOne(2000)
  if (s) {
    click(s.bounds().centerX(), s.bounds().centerY())
    const sp1 = s.parent().child(0).child(1)
    if (sp1) {
      sleep(random(500, 1500))
      click(sp1.bounds().centerX(), sp1.bounds().centerY())
    } else {
      const close = desc('关闭').findOne(2000)
      if (close) {
        sleep(random(500, 1500))
        click(close.bounds().centerX(), close.bounds().centerY())
      }
    }
  } else if (content) {
    const close = desc('关闭').findOne(2000)
    if (close) {
      sleep(random(500, 1500))
      click(close.bounds().centerX(), close.bounds().centerY())
    }
  }
}
function 等待稍等片刻() {
  // text="稍等片刻..."
  while (true) {
    const s = text('稍等片刻...').findOne(500)
    if (s) {
      sleep(random(50, 250))
      // click(s.bounds().centerX(), s.bounds().centerY());
    } else {
      break
    }
  }
}
function queryMonthData(电表信息) {
  // 点击电量趋势
  const 电量趋势 = text('电量趋势').findOne(5000)
  if (电量趋势) {
    电量趋势.click()
    sleep(random(1500, 3000))
  }
  // 电量（千瓦时）
  // [name="android.widget.TextView" && text="电量（千瓦时）"]
  const powerData = text('电量（千瓦时）').findOne(500)
  let pp1 = powerData.parent()
  let pdIndex = -1
  for (let i = 0; i < pp1.childCount(); i++) {
    if (pp1.child(i).text() == powerData.text()) {
      pdIndex = i
      break
    }
  }
  // console.log(pdIndex);

  if (pdIndex > 0) {
    sleep(random(150, 300))
    let pp1Counts = pp1.childCount()
    for (let i = pdIndex + 1; i < pp1Counts; i++) {
      // 重置pp1
      const powerData2 = text('电量（千瓦时）').find()
      if (powerData2 && powerData2.length > 0) {
        pp1 = powerData2[0].parent()
        pp1Counts = pp1.childCount()
      } else {
        console.log('未找到电量（千瓦时），可能是该月份没有数据。')
        return
      }
      // swipe(device.width/2, device.height/2, device.width/2, device.height/2 + 200, 100);
      // swipe(550, 0, 550, 1000, 100);
      const ppp1 = pp1.child(i)
      if (ppp1 == null) {
        sleep(realr.int(250, 500))
        i--
        continue
      }
      // console.log(ppp1);
      // console.log(ppp1.childCount());
      if (ppp1.childCount() == 3) {
        // console.log(ppp1.child(0));
        // 每日用电信息c0=2026-02-01 c1=8.87
        const 日期 = ppp1.child(0).text()
        const 用电量 = ppp1.child(1).text()
        if (电表信息.data[日期]) {
          console.log(`已存在${日期}数据，跳过。`)
          continue
        }
        console.log(`日期：${ppp1.child(0).text()}`)
        console.log(`用电度数：${ppp1.child(1).text()}`)
        while (true) {
          ppp1.child(2).click()
          sleep(realr.int(50, 150))
          const nppp1 = text(ppp1.child(0).text()).findOne(500)
          if (nppp1.parent().childCount() < i + 1) {
            const 峰谷信息 = nppp1
              .parent()
              .parent()
              .child(i + 1)
            console.log(nppp1.text())
            console.log(峰谷信息.child(0).text())
            if (峰谷信息) {
              if (峰谷信息.childCount() == 3) {
                let 峰电 = '0'
                if (用电量 > 0) {
                  峰电 = `${用电量}`
                }
                电表信息.data[日期] = {
                  power: 用电量,
                  尖: '0',
                  峰: 峰电,
                  平: '0',
                  谷: '0',
                }
                console.log(`获取到电数据->${JSON.stringify(电表信息.data[日期])}`)
                sleep(realr.int(50, 150))
                continue
              }
              // console.log("峰谷信息：" + 峰谷信息.text());
              // 分别查找尖，峰，平，谷，他们的位置+1就是对应的尖峰平谷度数了。
              const 尖 = 峰谷信息.child(2)
              const 峰 = 峰谷信息.child(4)
              const 平 = 峰谷信息.child(6)
              const 谷 = 峰谷信息.child(8)
              // console.log("尖：" + 尖.text());
              // console.log("峰：" + 峰.text());
              // console.log("平：" + 平.text());
              // console.log("谷：" + 谷.text());
              // console.log(电表信息);
              电表信息.data[日期] = {
                power: 用电量,
                尖: 尖.text(),
                峰: 峰.text(),
                平: 平.text(),
                谷: 谷.text(),
              }
              console.log(`获取到峰谷电数据->${JSON.stringify(电表信息.data[日期])}`)
            }
          } else {
            let 峰电 = '0'
            if (用电量 > 0) {
              峰电 = `${用电量}`
            }
            电表信息.data[日期] = {
              power: 用电量,
              尖: '0',
              峰: 峰电,
              平: '0',
              谷: '0',
            }
            console.log(`获取到电数据->${JSON.stringify(电表信息.data[日期])}`)
            sleep(realr.int(50, 150))
            continue
          }
          ppp1.child(2).click()
          sleep(realr.int(50, 150))
          // 分割日期xxxx-xx-xx
          const 日期2 = 日期.split('-')
          if (日期2.length == 3) {
            const 年 = Number.parseInt(日期2[0])
            const 月 = Number.parseInt(日期2[1])
            const 日 = Number.parseInt(日期2[2])
            if (日 > 25) {
              sleep(realr.int(150, 300))
            }
          }
          break
        }
      }
    }
  } else {
    console.log('未找到电量（千瓦时）的索引')
    return null
  }
}
function queryPowerData(mqtt_data, cfg) {
  sleep(realr.int(150, 300))
  // text="切换户号" && name="android.widget.TextView"
  let 切换户号 = text('切换户号').className('android.widget.TextView').findOne(5000)
  切换户号.click()
  // 查找户号列表
  // text="选择用电户号"
  等待稍等片刻()
  sleep(realr.int(500, 1000))
  let 选择用电户号 = text('选择用电户号').findOne(5000)
  const 电表信息列表 = []
  if (选择用电户号) {
    const 户号列表view = 选择用电户号.parent().parent().parent()
    for (let i = 1; i < 户号列表view.childCount() - 1; i++) {
      const user = 户号列表view.child(i)
      if (user && user.childCount() == 3) {
        const 户名 = user.child(0).text()
        const 户号 = user.child(1).text().substring(5)
        const 地址 = user.child(2).text()
        console.log(`户名：${户名}`)
        console.log(`户号：${户号}`)
        console.log(`地址：${地址}`)
        if (mqtt_data[户号]) {
          console.log(`MQTT中已存在：${户号}，使用MQTT数据。`)
          mqtt_data[户号].index = i
          电表信息列表.push(mqtt_data[户号])
        } else {
          console.log(`MQTT中不存在：${户号}，新建数据。`)
          电表信息列表.push({
            name: 户名,
            id: 户号,
            地址,
            index: i,
            data: {},
          })
        }
        // 查找mqtt_data里有没有相应的
      }
    }
    back()
    sleep(realr.int(1500, 3000))
  }
  // return 电表信息列表;
  const skips = 0
  for (const 电表信息 of 电表信息列表) {
    // if(skips<2){
    //     skips++;
    //     continue;
    // }
    console.log(`正在处理：${电表信息.name}`)
    切换户号 = text('切换户号').className('android.widget.TextView').findOne(5000)
    切换户号.click()
    等待稍等片刻()
    sleep(realr.int(500, 1000))
    选择用电户号 = text('选择用电户号').findOne(5000)
    const 户号列表view = 选择用电户号.parent().parent().parent()
    户号列表view.child(电表信息.index).click()
    等待稍等片刻()
    sleep(realr.int(500, 1000))
    console.log(`切换到户号${电表信息.id}`)
    // text="月度电费"
    let 月度电费 = text('月度电费').findOne(5000)
    if (月度电费) {
      const 月份列表 = []
      const 控件列表 = 月度电费.parent().parent()
      //
      // let powerData_1 = text("单位：千瓦时").findOne(500);
      let index_1 = -1
      for (let i = 0; i < 控件列表.childCount(); i++) {
        if (控件列表.child(i).text() == '单位：千瓦时') {
          index_1 = i
          break
        }
      }
      // let index_1 = 月度电费.parent().indexInParent();
      // console.log("index_1->" + index_1);
      let index选择月份 = index_1 - 3
      // let index电量趋势 = index_1+3;
      let 选择月份 = 控件列表.child(index选择月份)
      console.log(`选择月份控件->${选择月份.child(0).text()}`)
      if (选择月份.childCount() > 0 && (选择月份.child(0).text() == '选择月份' || 选择月份.child(0).text() == '日用电量')) {
        console.log('选择月份控件有子控件，可能为选择月份控件')
        index选择月份 = index_1 - 1
        选择月份 = 控件列表.child(index选择月份)
      }
      // console.log("获取选择月份控件成功->" + 选择月份.text());
      if (选择月份) {
        console.log(`获取选择月份控件成功->${选择月份.text()}`)
        // 点击位置
        // let k1 = 选择月份.parent();
        click(选择月份.bounds().centerX(), 选择月份.bounds().centerY())
        // 选择月份.parent().click();
        等待稍等片刻()
        sleep(realr.int(500, 1000))
        // text="01月"
        const 月份列表view = text('01月').findOne(5000).parent()
        // 遍历月份列表，text()就是月份，01月这样的格式，只保留数字存入月份数组中。
        for (let i = 0; i < 月份列表view.childCount(); i++) {
          const 月份列表view_item = 月份列表view.child(i)
          const 月份X = 月份列表view_item.text()
          if (月份X) {
            月份列表.push({
              id: Number.parseInt(月份X.substring(0, 2)),
              month: 月份X,
              index: 月份列表view_item.indexInParent(),
            })
          }
        }
        console.log(`获取月份列表成功->${月份列表}`)
        let firstm = true
        // 查找上个月最后一天有没有电费数据
        const today = new Date()
        const 上个月最后一天 = new Date(today.getFullYear(), today.getMonth(), 0)
        // 格式化为XXXX-XX-XX
        let skip_month = 0
        if (电表信息.data[format_date(上个月最后一天, 'yyyy-MM-dd')]) {
          console.log(`上个月最后一天有数据，跳过上个月，上个月日期${上个月最后一天.toUTCString()}`)
          skip_month = 上个月最后一天.getMonth() + 1
        } else {
          const 上上个月最后一天 = new Date(上个月最后一天.getFullYear(), 上个月最后一天.getMonth(), 0)
          if (电表信息.data[format_date(上个月最后一天, 'yyyy-MM-dd')]) {
            skip_month = 上上个月最后一天.getMonth() + 1
          }
        }
        for (const 月份 of 月份列表) {
          // \d+月正则匹配
          // let 月: string = 月份.month;
          console.log(`正在处理：${月份.month}`)
          if (月份.id <= skip_month) {
            console.log(`跳过月份：${月份.month}`)
            continue
          }
          if (!firstm) {
            // for (let i = 0; i < 5; i++) {
            //     sml_mov(device.width / 2, 200, device.width / 2, device.height / 2, 250);
            // }
            月度电费 = text('月度电费').findOne(5000)
            const 选择月份 = 控件列表.child(index选择月份)
            // console.log("获取选择月份控件成功->" + 选择月份.text());
            if (选择月份) {
              console.log(`获取选择月份控件成功->${选择月份.text()}`)
              // 点击位置
              // let k1 = 选择月份.parent();
              click(选择月份.bounds().centerX(), 选择月份.bounds().centerY())
              // 选择月份.parent().click();
              等待稍等片刻()
              sleep(realr.int(500, 1000))
            }
          }
          firstm = false
          const 月份X = 月份.month
          const item = text(月份X).findOne(5000)
          if (item) {
            item.click()
            // 确认
            let 确认 = text('确认').findOne(1500)
            if (确认) {
              sleep(realr.int(250, 500))
              click(确认.bounds().centerX(), 确认.bounds().centerY())
              sleep(realr.int(50, 250))
              确认 = text('确认').findOne(500)
              if (确认) {
                确认.click()
              }
            }
            sleep(realr.int(2000, 3000))
            try {
              queryMonthData(电表信息)
            } catch (e) {
              console.log(e)
            }
          }
        }
      }
    }
  }
  return 电表信息列表
}

function queryOtherData() {
  // sleep(random(150, 300));
  // //text="切换户号" && name="android.widget.TextView"
  // let 切换户号 = text("切换户号").className("android.widget.TextView").findOne(5000);
  // 切换户号.click();
  // let hh1= textMatches(/用电户号:\d+/).findOne(5000);
  // console.log(hh1.parent().text())
  // let hh1p = hh1.parent().parent();
  // 循环print text child
  // for(let i=0;i<hh1p.childCount();i++){
  //     let t = hh1p.child(i).child(0).text();
  //     console.log(t);
  // }
  let 应交金额 = ''
  let 账户余额 = ''
  let 近七日累计用电量 = ''
  let 上期电量 = ''
  let 上期电费 = ''
  let 年累计电费 = ''
  const np = text('应交金额').findOne(5000)
  if (np) {
    const npp = np.parent()
    for (let i = 0; i < npp.childCount(); i++) {
      // 查找TEXT应交金额
      const t = npp.child(i).text()
      if (t == '应交金额') {
        const item = npp.child(i + 2)
        应交金额 = item.text()
      } else if (t == '近七日累计用电量') {
        const item = npp.child(i + 2)
        近七日累计用电量 = item.text()
      } else if (t == '账户余额：') {
        const item = npp.child(i + 1)
        账户余额 = item.text()
      }
    }
  }
  // text="上期电量"
  const 上期电量v = text('上期电量').findOne(5000)
  if (上期电量v) {
    const npp = 上期电量v.parent()
    上期电量 = npp.child(1).text()
  }
  const 上期电费v = text('上期电费').findOne(5000)
  if (上期电费v) {
    const npp = 上期电费v.parent()
    上期电费 = npp.child(1).text()
  }
  const 年累计电费v = text('年累计电费').findOne(5000)
  if (年累计电费v) {
    const npp = 年累计电费v.parent()
    年累计电费 = npp.child(1).text()
  }
  console.log(`应交金额：${应交金额}`)
  console.log(`账户余额：${账户余额}`)
  console.log(`近七日累计用电量：${近七日累计用电量}`)
  console.log(`上期电量：${上期电量}`)
  console.log(`上期电费：${上期电费}`)
  console.log(`年累计电费：${年累计电费}`)
  return {
    应交金额,
    账户余额,
    近七日累计用电量,
    上期电量,
    上期电费,
    年累计电费,
  }
}
function queryData(mqtt_data, cfg) {
  try {
    toastLog('开始运行网上国网任务')
    startApp()
    waitForActivity(mainActivityName)
    sleep(realr.int(3000, 8000))
    skipAd()
    sleep(realr.int(2000, 5000))
    // text="年累计电量"
    const 年累计电量 = text('年累计电量').findOne(10000)
    if (年累计电量) {
      click(年累计电量.bounds().centerX(), 年累计电量.bounds().centerY())
      等待稍等片刻()
      sleep(realr.int(500, 1000))
      const 电表信息列表 = queryPowerData(mqtt_data, cfg)
      等待稍等片刻()
      sleep(realr.int(500, 1000))
      back()
      等待稍等片刻()
      sleep(realr.int(500, 1000))
      // text="应交金额"
      const 应交金额 = text('应交金额').findOne(5000)
      if (应交金额) {
        click(应交金额.bounds().centerX(), 应交金额.bounds().centerY())
        console.log('进入应交页面')
        sleep(realr.int(5000, 10000))
        for (const index in 电表信息列表) {
          const 电表信息 = 电表信息列表[index]
          const 切换户号 = text('切换户号').className('android.widget.TextView').findOne(5000)
          click(切换户号.bounds().centerX(), 切换户号.bounds().centerY())
          // 切换户号.click();
          sleep(realr.int(5000, 8000))

          const hh1 = text(`用电户号:${电表信息.id}`).findOne(5000)
          if (hh1) {
            click(hh1.bounds().centerX(), hh1.bounds().centerY())
            sleep(realr.int(8000, 15000))
            const ext_data = queryOtherData()
            电表信息列表[index] = { ...电表信息, ...ext_data }
          }
        }
      }
      console.log(JSON.stringify(电表信息列表, null, 2))
      //
      return 电表信息列表
    }
  } finally {
    创建GKD快照()
    stopApp()
  }
}

function publishSgccData() {
  stopApp()
  const cfg = loadConfig()
  autoApplyRequest(cfg)
  const mqtt_data = {}
  console.log('配置已加载，准备获取数据。')
  console.log(JSON.stringify(cfg, null, 2))
  // 连接MQTT服务器
  const client = new MqttAndroidClient(context, cfg.host, `autox-sgcc-mqtt-${realr.int(888, 88888)}`)
  const mqttConnectOptions = new MqttConnectOptions()
  mqttConnectOptions.setAutomaticReconnect(true)
  mqttConnectOptions.setCleanSession(false)
  mqttConnectOptions.setUserName(cfg.username)
  mqttConnectOptions.setPassword(Array.from(cfg.password))
  // 遗嘱消息 QOS = 1, retained = true
  const willMsgJavaString = new java.lang.String('i am gone')
  const willMsgJavaBytes = willMsgJavaString.getBytes('UTF-8')
  mqttConnectOptions.setWill('device-gone', willMsgJavaBytes, 1, true)
  const subscribeToTopic = () => {
    try {
      const QOS = 0
      const TOPIC = `${cfg.topic_prefix}/+`
      client.subscribe(
        TOPIC,
        QOS,
        null,
        // @ts-except-error
        new IMqttActionListener({
          onSuccess: (token) => {
            console.log(`MQTT 订阅成功->${TOPIC}`)
          },
          onFailure: (token, error) => {
            console.error(`MQTT 订阅失败 ${error}`)
          },
        }),
      )
    } catch (error) {
      console.error(error.message)
      alert(`MQTT 订阅错误\n\n"${error.message}`)
    }
  }
  console.log('mqttConnectOptions', mqttConnectOptions)
  // @ts-except-error
  const callback = new MqttCallbackExtended({
    connectComplete: (reconnect, serverUri) => {
      if (reconnect) {
        // subscribeToTopic();
        subscribeToTopic()
        console.log('重新连接到 MQTT')
      } else {
        console.log('连接到 MQTT')
      }
    },
    connectionLost: () => {
      console.log('MQTT 连接丢失')
    },
    messageArrived: (topic, message) => {
      // 增加日志，看看到底收没收到

      const payloadStr = String(new java.lang.String(message.getPayload(), 'UTF-8'))
      console.log(`[收到消息] 主题: ${topic}, 内容: ${payloadStr.substring(0, 40)}, 是否保留: ${message.isRetained()}`)
      const data = JSON.parse(payloadStr)
      mqtt_data[data.id] = data
    },
  })
  client.setCallback(callback)

  const publish = (topic, msg, qos = 1, retained = false) => {
    // publish message
    try {
      const javaString = new java.lang.String(msg)
      const byteArray = javaString.getBytes('UTF-8')
      client.publish(topic, byteArray, qos, retained)
    } catch (error) {
      console.error('MQTT 发布失败', error)
    }
  }
  client.connect(
    mqttConnectOptions,
    null,
    new IMqttActionListener({
      onSuccess: () => {
        subscribeToTopic()
        console.log('mqtt 连接成功')
        // subscribeToTopic();
        console.log('开始获取数据')
        // 等待10秒获取mqtt数据
        threads.start(() => {
          console.log('等待10秒获取mqtt数据')
          // sleep(10000);
          const data = queryData(mqtt_data, cfg)
          for (const index in data) {
            const 电表信息 = data[index]
            const topic = `${cfg.topic_prefix}/${电表信息.id}`
            console.log('发布数据', topic)
            publish(topic, JSON.stringify(电表信息, null, 0), 1, true)
            // let topic = `${cfg.mqtt_topic}/${cfg.username}/${cfg.password}/${cfg.device_id}/${cfg.device_name}/${cfg.device_type}/${cfg.device_location}/${cfg.device_model}/${cfg.device_serial}/${cfg.device_manufacturer}/${cfg.device_firmware_version}/${cfg.device_hardware_version}/${cfg.device_}
          }
          client.close()
          client.disconnect()
          console.log('任务结束')
        })
      },
      onFailure: (token, error) => {
        console.error('mqtt 连接失败', error)
        // exit();
      },
    }),
  )
}

function run() {
  try {
    const cfg = loadConfig()
    autoApplyRequest(cfg)
    toastLog('开始运行网上国网任务')
    startApp()
    waitForActivity(mainActivityName)
    sleep(realr.int(3000, 8000))
    // [id="com.taobao.idlefish:id/icon_entry" && desc="闲鱼币"]
    // [desc="未选定今日不再出现"]
    // [id="android:id/content"]
    skipAd()
    sleep(realr.int(500, 1500))
    // name="android.view.ViewGroup" && desc="签到"
    const sign = className('android.view.ViewGroup').desc('签到').findOne(5000)
    if (sign) {
      sleep(realr.int(500, 1500))
      console.log('已点击「签到」按钮')
      click(sign.bounds().centerX(), sign.bounds().centerY())
      sleep(realr.int(500, 1500))
    }
    sleep(15000)

    // let coin = id("com.taobao.idlefish:id/icon_entry").desc("闲鱼币").findOne();
    // if(coin){
    //     click(coin.bounds().centerX(),coin.bounds().centerY());
    //     sleep(random(5000,12000));
    //     click(486,1060);
    //     sleep(random(2000,4000));
    //     //[text="签到"]
    //     let sign = text("签到").findOne(2000);
    //     if(sign){
    //         console.log("已点击「签到」按钮");
    //         sign.click();
    //         sleep(random(500,1500));
    //     }
    //     while(true){
    //         let getGift = text("领取奖励").findOne(500);
    //         if(getGift){
    //             console.log("已点击「领取奖励」按钮");
    //             getGift.click();
    //             sleep(random(1000,2500));
    //         }else{
    //             break;
    //         }
    //     }
    // }
  } finally {
    创建GKD快照()
    stopApp()
  }
}

export { publishSgccData, queryData, queryMonthData, queryPowerData, run, startApp, stopApp }
