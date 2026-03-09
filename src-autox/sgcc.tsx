import type { DeviceInfo, ElectricityPriceList, MqttDeviceLatch, SgccInfoJson } from './sgcc_type'
// import Decimal from 'decimal.js';
import Big from 'big.js'
import { format as format_date } from 'date-fns'
import realr from 'random'
import { autoApplyRequest, formatNanoToTime, getDaysInCurrentMonth, loadConfig, 创建GKD快照 } from './common'

importPackage(Packages['org.eclipse.paho.client.mqttv3'])
importClass('org.eclipse.paho.android.service.MqttAndroidClient')
importClass('java.util.concurrent.CountDownLatch')
// importPackage(' java.lang.System');
//   const CountDownLatch = java.util.concurrent.CountDownLatch;
const appPackageName = 'com.sgcc.wsgw.cn'
const mainActivityName = 'com.sgcc.wsgw.rnbundle.activity.HomeReactActivity'
const BIG_ZERO = new Big(0)
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
  sleep(realr.int(500, 1000))
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
    sleep(realr.int(500, 1000))
    等待稍等片刻()
    sleep(realr.int(500, 1000))
    选择用电户号 = text('选择用电户号').findOne(5000)
    const 户号列表view = 选择用电户号.parent().parent().parent()
    户号列表view.child(电表信息.index).click()
    sleep(realr.int(500, 1000))
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
        sleep(realr.int(500, 1000))
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
              sleep(realr.int(500, 1000))
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
        // 日用电量数据获取完成，开始获得月度电费。
        queryEveryMonthFee(电表信息)
        // 切换掉日用电量 name="android.widget.TextView"&text="日用电量"
        const 日用电量 = text('日用电量').findOne(2000)
        if (日用电量) {
          日用电量.click()
        }
      }
    }
  }
  return 电表信息列表
}

function queryEveryMonthFee(data) {
  let 数据表 = {
    // XXXX年:{}
  }
  if (!data['月度电费']) {
    数据表 = data['月度电费']
  } else {
    data['月度电费'] = 数据表
  }
  const 月度电费_view = text('月度电费').findOne(500)
  if (月度电费_view) {
    月度电费_view.click()
    sleep(realr.int(500, 1000))
    等待稍等片刻()
    sleep(realr.int(500, 1000))
    const today = new Date()
    // text="2026年"
    const 年_1 = text(`${today.getFullYear()}年`).findOne(500)
    const 年_2 = text(`${today.getFullYear() - 1}年`).findOne(500)
    const 年_3 = text(`${today.getFullYear() - 2}年`).findOne(500)
    if (年_1) {
      const year_data = query_year_moth_data(年_1.text())
      数据表[年_1.text()] = year_data
    }
    if (年_2) {
      const year_data = query_year_moth_data(年_2.text())
      数据表[年_2.text()] = year_data
    }
    if (年_3) {
      const year_data = query_year_moth_data(年_3.text())
      数据表[年_3.text()] = year_data
    }
  }
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
  const 年累计电费 = ''
  let 已发行电费处于 = ''
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
      } // 已发行电费处于
      else if (t == '已发行电费处于') {
        const item = npp.child(i + 2)
        已发行电费处于 = item.text()
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
  // const 年累计电费v = text('年累计电费').findOne(5000)
  // if (年累计电费v) {
  //     const npp = 年累计电费v.parent()
  //     年累计电费 = npp.child(1).text()
  // }
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
    已发行电费处于,
    // 年累计电费,
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
      sleep(realr.int(500, 1000))
      等待稍等片刻()
      sleep(realr.int(500, 1000))
      const 电表信息列表 = queryPowerData(mqtt_data, cfg)
      sleep(realr.int(500, 1000))
      等待稍等片刻()
      sleep(realr.int(500, 1000))
      back()
      sleep(realr.int(500, 1000))
      等待稍等片刻()
      sleep(realr.int(500, 1000))
      // text="应交金额"
      const 应交金额 = text('应交金额').findOne(5000)
      if (应交金额) {
        click(应交金额.bounds().centerX(), 应交金额.bounds().centerY())
        console.log('进入应交页面')

        sleep(realr.int(500, 1000))
        等待稍等片刻()
        sleep(realr.int(500, 1000))
        for (const index in 电表信息列表) {
          const 电表信息 = 电表信息列表[index]
          const 切换户号 = text('切换户号').className('android.widget.TextView').findOne(3000)
          click(切换户号.bounds().centerX(), 切换户号.bounds().centerY())
          // 切换户号.click();
          // sleep(realr.int(5000, 8000))
          sleep(realr.int(500, 1000))
          等待稍等片刻()
          sleep(realr.int(500, 1000))

          const hh1 = text(`用电户号:${电表信息.id}`).findOne(5000)
          if (hh1) {
            click(hh1.bounds().centerX(), hh1.bounds().centerY())
            sleep(realr.int(500, 1000))
            等待稍等片刻()
            sleep(realr.int(500, 1000))
            const ext_data = queryOtherData()
            电表信息列表[index] = { ...电表信息, ...ext_data }
          }
        }
      }
      // console.log(JSON.stringify(电表信息列表, null, 2))
      //
      return 电表信息列表
    }
  } finally {
    创建GKD快照()
    stopApp()
  }
}

function query_year_moth_data(full_year) {
  const 年_1 = text(`${full_year}`).findOne(500)
  if (年_1) {
    const year_data = {
      年累计电费: '',
      年累计电量: '',
      月份数据: {},
    }
    年_1.click()
    sleep(realr.int(500, 1000))
    等待稍等片刻()
    sleep(realr.int(500, 1000))
    // text="年累计电费(元)"
    const 年累计电费 = text('年累计电费(元)').findOne(500)
    // 从parent查找年累计电费index位置，后一位是数值。
    const 年累计电费p = 年累计电费.parent()
    for (let i = 0; i < 年累计电费p.childCount(); i++) {
      const t = 年累计电费p.child(i).text()
      if (t == '年累计电费(元)') {
        const 年累计电费v = 年累计电费p.child(i + 1).text()
        // console.log(`年累计电费：${年累计电费v}`);
        const 年累计电量v = 年累计电费p.child(i + 3).text()
        // console.log(`年累计电量v：${年累计电量v}`);
        year_data['年累计电费'] = 年累计电费v
        year_data['年累计电量'] = 年累计电量v
        break
      }
    }
    // 查找text="yyyy年mm月"，从1月遍历到mm月。
    const months = textMatches(/\d+年\d+月/).find()
    // console.log(months.length);
    for (let i = 0; i < months.length; i++) {
      const month_data = {
        结算结果: '',
        本期电费: '',
        本期电量: '',
      }
      // 查找yyyy年MM月
      // let month_text
      const month_text = text(months[i].text()).findOne(500)
      // 正则匹配月份数据
      const month_text_match = month_text.text().match(/\d+年(\d+)月/)
      const month_t = month_text_match[1]
      const t1 = month_text.text()
      // 展示数据
      if (month_text) {
        // 查找parent中的index
        const month_text_p = month_text.parent()
        let month_text_index = -1
        // console.log(month_text_p.child(0));
        for (let i2 = 0; i2 < month_text_p.childCount(); i2++) {
          const t2 = month_text_p.child(i2).text()
          if (t1 == t2) {
            month_text_index = i2
            // console.log(`${t1} index:${month_text_index}`);
          }
        }
        if (month_text_index != -1) {
          month_data.结算结果 = month_text_p.child(month_text_index + 1).text()
          month_data.本期电费 = month_text_p.child(month_text_index + 2).text()
          month_data.本期电量 = month_text_p.child(month_text_index + 4).text()
          year_data.月份数据[`${month_t}月`] = month_data
        }
      }
    }
    return year_data
  }
  return null
}
function test() {
  // text="月度电费"
  const 数据表 = {}
  const 月度电费 = text('月度电费').findOne(500)
  if (月度电费) {
    月度电费.click()
    sleep(realr.int(500, 1000))
    等待稍等片刻()
    sleep(realr.int(500, 1000))
    const today = new Date()
    // text="2026年"
    const 年_1 = text(`${today.getFullYear()}年`).findOne(500)
    const 年_2 = text(`${today.getFullYear() - 1}年`).findOne(500)
    const 年_3 = text(`${today.getFullYear() - 2}年`).findOne(500)
    if (年_1) {
      const year_data = query_year_moth_data(年_1.text())
      数据表[年_1.text()] = year_data
    }
    if (年_2) {
      const year_data = query_year_moth_data(年_2.text())
      数据表[年_2.text()] = year_data
    }
    if (年_3) {
      const year_data = query_year_moth_data(年_3.text())
      数据表[年_3.text()] = year_data
    }
  }
  console.log(JSON.stringify(数据表, null, 2))
}
// 写一个函数，统计当月的用电量数据，将它们相加，并且写入电表数据。
function queryMonthExtData(电表信息: SgccInfoJson) {
  const today = new Date()
  let 当月尖电量 = new Big(0.0)
  let 当月平电量 = new Big(0.0)
  let 当月峰电量 = new Big(0.0)
  let 当月谷电量 = new Big(0.0)
  let 当月总电量 = new Big(0.0)
  const 电表每日数据 = 电表信息.data
  // 过滤当月的key 里面key格式是2026-MM-dd
  const 当月keys = Object.keys(电表每日数据).filter((key) => key.startsWith(format_date(today, 'yyyy-MM')))
  console.log(`当月key:${当月keys}`)
  for (let i = 0; i < 当月keys.length; i++) {
    const key = 当月keys[i]
    // conso
    const data = 电表每日数据[key]
    console.log(`key:${key} data:${JSON.stringify(data)}`)
    if (data.尖) {
      // 当月尖电量 += parseFloat(data.尖);
      当月尖电量 = 当月尖电量.plus(Number.parseFloat(data.尖))
      // console.log(`尖电量:${data.尖}`);
    }
    if (data.平) {
      // 当月平电量 += parseFloat(data.平);
      当月平电量 = 当月平电量.plus(Number.parseFloat(data.平))
      // console.log(`平电量:${data.平}`);
    }
    if (data.峰) {
      // 当月峰电量 += parseFloat(data.峰);
      当月峰电量 = 当月峰电量.plus(Number.parseFloat(data.峰))
      // console.log(`峰电量:${data.峰}`);
    }
    if (data.谷) {
      // 当月谷电量 += parseFloat(data.谷);
      当月谷电量 = 当月谷电量.plus(Number.parseFloat(data.谷))
      // console.log(`谷电量:${data.谷}`);
    }
    if (data.power) {
      // 当月总电量 += parseFloat(data.power);
      当月总电量 = 当月总电量.plus(Number.parseFloat(data.power))
      // console.log(`总电量:${data.power}`);
    }
  }
  console.log(`当月总电量:${当月总电量}`)
  console.log(`当月尖电量:${当月尖电量}`)
  console.log(`当月平电量:${当月平电量}`)
  console.log(`当月峰电量:${当月峰电量}`)
  console.log(`当月谷电量:${当月谷电量}`)
  电表信息.最新数据['本月尖电'] = 当月尖电量.toFixed(2)
  电表信息.最新数据['本月平电'] = 当月平电量.toFixed(2)
  电表信息.最新数据['本月峰电'] = 当月峰电量.toFixed(2)
  电表信息.最新数据['本月谷电'] = 当月谷电量.toFixed(2)
  电表信息.最新数据['本月总电量'] = 当月总电量.toFixed(2)
  // 获取当月总天数
  const 当月总天数 = getDaysInCurrentMonth()
  // 通过平均值计算本月预计用电量
  let 预计当月尖电 = new Big(当月尖电量)
  if (当月尖电量.gt(0)) {
    预计当月尖电 = 预计当月尖电.div(当月keys.length)
    预计当月尖电 = 预计当月尖电.times(当月总天数)
  }
  let 预计当月平电 = new Big(当月平电量)
  if (当月平电量.gt(0)) {
    预计当月平电 = 预计当月平电.div(当月keys.length)
    预计当月平电 = 预计当月平电.times(当月总天数)
  }
  let 预计当月峰电 = new Big(当月峰电量)
  if (当月峰电量.gt(0)) {
    预计当月峰电 = 预计当月峰电.div(当月keys.length)
    预计当月峰电 = 预计当月峰电.times(当月总天数)
  }
  let 预计当月谷电 = new Big(当月谷电量)
  if (当月谷电量.gt(0)) {
    预计当月谷电 = 预计当月谷电.div(当月keys.length)
    预计当月谷电 = 预计当月谷电.times(当月总天数)
  }

  const 最新数据 = 电表信息.最新数据
  最新数据['预计本月谷电'] = 预计当月谷电.toFixed(2)
  最新数据['预计本月平电'] = 预计当月平电.toFixed(2)
  最新数据['预计本月峰电'] = 预计当月峰电.toFixed(2)
  最新数据['预计本月尖电'] = 预计当月尖电.toFixed(2)

  let 总用电量 = new Big(0.0)
  let 总电费量 = new Big(0.0)
  // 总用电量.plus(当月总电量);
  const 月度电费 = 电表信息.月度电费
  const 电价表 = 电表信息.电价价目表
  for (const itemKey in 月度电费) {
    const 年份数据 = 月度电费[itemKey]
    总用电量 = 总用电量.plus(Number.parseFloat(年份数据.年累计电量))
    总电费量.plus(Number.parseFloat(年份数据.年累计电费))
    if (itemKey == format_date(today, 'yyyy年')) {
      if (!年份数据.月份数据[`${today.getMonth() + 1}月`]) {
        // 最新数据["电费包含本月数据"] = false;
        总用电量 = 总用电量.plus(当月总电量)
        query_current_power_level(总用电量, 电价表)
        const 年累计电量 = new Big(年份数据.年累计电量)
        let 年累计电费 = new Big(年份数据.年累计电费)
        年累计电量.plus(当月总电量)
        最新数据['年累计电量'] = 年累计电量.toFixed(2)
        if (电价表.峰谷电) {
          let 当月峰电价 = new Big(电价表.当前峰电价)
          let 当月谷电价 = new Big(电价表.当前谷电价)
          if (当月峰电量.gt(0)) 当月峰电价 = 当月峰电价.times(当月峰电量)
          if (当月谷电量.gt(0)) 当月谷电价 = 当月谷电价.times(当月谷电量)
          let 当月电费 = new Big(当月峰电价)
          当月电费 = 当月电费.plus(当月谷电价)
          const 当月平电费 = 当月平电量.gt(0) ? new Big(电价表.当前平电价).times(当月平电量) : new Big(0.0)
          const 当月尖电费 = 当月尖电量.gt(0) ? new Big(电价表.当前尖电价).times(当月尖电量) : new Big(0.0)
          总电费量 = 总电费量.plus(当月电费)
          年累计电费 = 年累计电费.plus(当月电费)
          最新数据['当月峰电电费'] = 当月峰电价.toFixed(3)
          最新数据['当月谷电电费'] = 当月谷电价.toFixed(3)
          最新数据.当月平电电费 = 当月平电费.toFixed(3)
          最新数据.当月尖电电费 = 当月尖电费.toFixed(3)
          最新数据['当月总电费'] = 当月电费.toFixed(3)
        } else {
          let 当月电费 = new Big(电价表.当前电价)
          当月电费 = 当月电费.gt(0) ? 当月电费.times(当月总电量) : BIG_ZERO
          总电费量 = 总电费量.plus(当月电费)
          年累计电费 = 年累计电费.plus(当月电费)
          最新数据['当月总电费'] = 当月电费.toFixed(3)
        }
        最新数据['年累计电费'] = 年累计电费.toFixed(3)
        //
      }
    }
    最新数据['总用电量'] = 总用电量.toFixed(2)
    最新数据['总电费量'] = 总电费量.toFixed(3)
    let 预计当月无分时总电费 = ''
    let 预计当月有分时总电费 = ''
    // 分时电费
    let 预计峰电费 = new Big(电价表.当前峰电价)
    预计峰电费 = 预计当月峰电.gt(0) ? 预计峰电费.times(预计当月峰电) : BIG_ZERO
    let 预计谷电费 = new Big(电价表.当前谷电价)
    预计谷电费 = 预计谷电费.gt(0) ? 预计谷电费.times(预计当月谷电) : BIG_ZERO
    let 预计平电费 = new Big(电价表.当前平电价)
    预计平电费 = 预计平电费.gt(0) ? 预计平电费.times(预计当月平电) : BIG_ZERO
    const 预计尖电费 = 预计当月尖电.gt(0) ? new Big(电价表.当前尖电价).times(预计当月尖电) : BIG_ZERO
    // let 预计本月平电 = new Big(电价表.当前电价);
    const 预计总电费 = new Big(预计峰电费).plus(预计平电费).plus(预计谷电费).plus(预计尖电费)
    // 预计总电费 = 预计总电费.plus(预计谷电费);
    预计当月有分时总电费 = 预计总电费.toFixed(3)
    // 有分时电费
    let 预计电费 = new Big(预计当月尖电).plus(预计当月峰电).plus(预计当月平电).plus(预计当月谷电)
    if (预计电费.gt(0)) {
      预计电费 = 预计电费.times(new Big(电价表.当前电价))
    }
    预计当月无分时总电费 = 预计电费.toFixed(3)
    最新数据.预计本月用电量 = new Big(预计当月尖电).plus(预计当月平电).plus(预计当月谷电).plus(预计当月峰电).toFixed(2)
    if (电价表.峰谷电) {
      最新数据.预计本月总电费 = 预计当月有分时总电费
    } else {
      最新数据.预计本月总电费 = 预计当月无分时总电费
    }
    最新数据.预计本月分时价格差 = new Big(预计当月无分时总电费).minus(预计当月有分时总电费).toFixed(3)
  }
  // 电表信息.最新数据['预计本月谷电'] = (当月谷电量 / 当月keys.length * 当月总天数).toFixed(2);
  // 电表信息.最新数据['预计本月平电'] = (当月平电量 / 当月keys.length * 当月总天数).toFixed(2);
  // 电表信息.最新数据['预计本月峰电'] = (当月峰电量 / 当月keys.length * 当月总天数).toFixed(2);
  // 电表信息.最新数据['预计本月尖电'] = (当月尖电量 / 当月keys.length * 当月总天数).toFixed(2);
}

function check_power_range(power: Big, range: string) {
  // "一阶范围": "<2769",
  // "二阶范围": "2760-4800",
  // "三阶范围": ">4800",
  // 范围是上面的格式，先判断是哪种格式然后计算power的范围。
  if (range.startsWith('<')) {
    const range_value = new Big(range.substring(1))
    if (power.lt(range_value)) {
      return true
    }
  } else if (range.startsWith('>')) {
    const range_value = new Big(range.substring(1))
    if (power.gt(range_value)) {
      return true
    }
  } else if (range.includes('-')) {
    const range_value = range.split('-')
    if (power.gt(new Big(range_value[0])) && power.lt(new Big(range_value[1]))) {
      return true
    }
  }
  return false
}
function query_current_power_level(power: Big, price: ElectricityPriceList) {
  // price 为上面的数据，电价有三个阶梯，我需要你根据power的数值来计算出当前电价阶梯。
  // let l1_range = price.一阶范围;
  // let l2_range = price.二阶范围;
  // let l3_range = price.三阶范围;
  if (power.gte(price.三阶起始)) {
    price.当前电价 = price.电价三阶
    price.当前阶梯 = 3
    price.当前谷电价 = price.谷电价三阶
    price.当前峰电价 = price.峰电价三阶
    price.当前平电价 = price.平电价三阶
    price.当前尖电价 = price.尖电价三阶
  } else if (power.gte(price.二阶起始)) {
    price.当前电价 = price.电价二阶
    price.当前阶梯 = 2
    price.当前谷电价 = price.谷电价二阶
    price.当前峰电价 = price.峰电价二阶
    price.当前平电价 = price.平电价二阶
    price.当前尖电价 = price.尖电价二阶
  } else {
    price.当前电价 = price.电价一阶
    price.当前阶梯 = 1
    price.当前谷电价 = price.谷电价一阶
    price.当前峰电价 = price.峰电价一阶
    price.当前平电价 = price.平电价一阶
    price.当前尖电价 = price.尖电价一阶
  }
}

function publishSgccData(waitThread = false) {
  stopApp()
  const cfg = loadConfig()
  // autoApplyRequest(cfg)
  const mqtt_data: Record<string, SgccInfoJson> = {}
  const mqtt_devices: Record<string, MqttDeviceLatch> = {}
  console.log('配置已加载，准备获取数据。')
  // 连接MQTT服务器
  // @ts-expect-error Java类型
  const client = new MqttAndroidClient(context, cfg.host, `autox-sgcc-mqtt-${realr.int(888, 88888)}`)
  // @ts-expect-error Java类型
  const mqttConnectOptions = new MqttConnectOptions()
  mqttConnectOptions.setAutomaticReconnect(true)
  mqttConnectOptions.setCleanSession(false)
  mqttConnectOptions.setUserName(cfg.username)
  mqttConnectOptions.setPassword(Array.from(cfg.password))
  // 遗嘱消息 QOS = 1, retained = true
  const willMsgJavaString = new java.lang.String('i am gone')
  const willMsgJavaBytes = willMsgJavaString.getBytes('UTF-8')
  mqttConnectOptions.setWill('device-gone', willMsgJavaBytes, 1, true)
  let isTimeout = false // 超时标记：true=已超时，忽略后续Topic
  // @ts-expect-error Java类型
  const latch_1 = new CountDownLatch(1) // 用于主线程等待
  const subscribeToTopic = (TOPIC: string, QOS = 0) => {
    try {
      // const QOS = 0
      // const TOPIC = `${cfg.topic_prefix}/+`
      client.subscribe(
        TOPIC,
        QOS,
        null,
        // @ts-expect-error Java类型
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
  const validTopicTypes = [
    'l1price',
    'l2price',
    'l2price_feng',
    'l2price_gu',
    'l2price_ping',
    'l2price_jian',
    'l3price',
    'l3price_feng',
    'l3price_gu',
    'l3price_ping',
    'l3price_jian',
    'l2cost_start',
    'l3cost_start',
    'fenggu_enable',
  ]
  // @ts-except-error Java类型
  const callback =
    // @ts-expect-error Java类型
    new MqttCallbackExtended({
      connectComplete: (reconnect, serverUri) => {
        if (reconnect) {
          // subscribeToTopic();
          // subscribeToTopic(`${cfg.topic_prefix}/device_info`)
          console.log('重新连接到 MQTT')
        } else {
          console.log('连接到 MQTT')
        }
      },
      connectionLost: () => {
        console.log('MQTT 连接丢失')
      },
      messageArrived: (topic: string, message) => {
        // 增加日志，看看到底收没收到

        const payloadStr = String(new java.lang.String(message.getPayload(), 'UTF-8'))
        console.log(`[收到消息] 主题: ${topic}, 内容: ${payloadStr.substring(0, 40)}, 是否保留: ${message.isRetained()}`)

        // 匹配时候是否是${cfg.topic_prefix}/[0-9]+/[a-zA-Z0-9_-]
        // let check_topic_prefix = /\/([0-9]+)\/([a-z_]+)/
        if (topic == `${cfg.topic_prefix}/device_info`) {
          if (isTimeout) {
            return
          }
          // 获取设备信息
          try {
            const data = JSON.parse(payloadStr)
            console.log(`收到设备列表${JSON.stringify(data)}`)
            const device_info: DeviceInfo = data
            for (const id of device_info.设备列表) {
              mqtt_devices[id] = {
                // @ts-expect-error Java类型
                device_latch: new CountDownLatch(1),
                // @ts-expect-error Java类型
                types_latch: new CountDownLatch(validTopicTypes.length),
                topic_prefix: `${cfg.topic_prefix}/${id}`,
                is_timeout: false,
              }
              console.log(`订阅设备${id}信息`)

              client.subscribe(
                [`${cfg.topic_prefix}/${id}`],
                1,
                null,
                // @ts-expect-error Java类型
                new IMqttActionListener({
                  onSuccess: (token) => {
                    console.log(`MQTT 订阅成功->${topic}`)
                  },
                  onFailure: (token, error) => {
                    console.error(`MQTT 订阅失败 ${error}`)
                  },
                }),
              )
            }
          } catch (e) {
            console.error(e)
          } finally {
            latch_1.countDown()
          }
        } else {
          for (const id in mqtt_devices) {
            const device = mqtt_devices[id]
            if (topic.startsWith(device.topic_prefix)) {
              console.log(`开始设置${topic}信息`)
              const s = topic.split('/')
              if (s.length == 3) {
                const type = s[2]
                const 电表信息 = mqtt_data[id]
                if (validTopicTypes.includes(type)) {
                  const 价目表 = 电表信息.电价价目表
                  const value = payloadStr
                  if (device.is_timeout) {
                    console.log(`已超时，忽略后续Topic`)
                    client.unsubscribe(topic)
                    return
                  }
                  try {
                    switch (type) {
                      case 'l1price':
                        价目表.电价一阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的一阶电价：${value} ¥/kWh`)
                        break

                      case 'l2price':
                        价目表.电价二阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的二阶电价（无峰谷）：${value} ¥/kWh`)
                        break

                      case 'l2price_feng':
                        价目表.峰电价二阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的二阶峰电价：${value} ¥/kWh`)
                        break

                      case 'l2price_gu':
                        价目表.谷电价二阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的二阶谷电价：${value} ¥/kWh`)
                        break

                      case 'l2price_ping':
                        价目表.平电价二阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的二阶平电价：${value} ¥/kWh`)
                        break

                      case 'l2price_jian':
                        价目表.尖电价二阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的二阶尖电价：${value} ¥/kWh`)
                        break

                      case 'l3price_feng':
                        价目表.峰电价三阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的三阶峰电价：${value} ¥/kWh`)
                        break

                      case 'l3price_gu':
                        价目表.谷电价三阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的三阶谷电价：${value} ¥/kWh`)
                        break

                      case 'l3price_ping':
                        价目表.平电价三阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的三阶平电价：${value} ¥/kWh`)
                        break

                      case 'l3price_jian':
                        价目表.尖电价三阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的三阶尖电价：${value} ¥/kWh`)
                        break

                      case 'l3price':
                        价目表.电价三阶 = Number.parseFloat(value)
                        console.log(`更新电表${电表信息.id}的三阶电价（无峰谷）：${value} ¥/kWh`)
                        break

                      case 'l2cost_start':
                        价目表.二阶起始 = Number.parseInt(value)
                        console.log(`更新电表${电表信息.id}的二阶起始度数：${value} kWh`)
                        break

                      case 'l3cost_start':
                        价目表.三阶起始 = Number.parseInt(value)
                        console.log(`更新电表${电表信息.id}的三阶起始度数：${value} kWh`)
                        break

                      case 'fenggu_enable':
                        价目表.峰谷电 = Boolean(value)
                        console.log(`电表${电表信息.id}峰谷电启用状态：${value ? '开启' : '关闭'}`)
                        break
                    }
                  } catch (e) {
                    console.error(`解析数据失败 ${e}`)
                  } finally {
                    client.unsubscribe(topic)
                    device.types_latch.countDown()
                  }
                }
              } else {
                client.unsubscribe(device.topic_prefix)
                const topics = validTopicTypes.map((type) => `${device.topic_prefix}/${type}`)
                try {
                  mqtt_data[id] = JSON.parse(payloadStr)
                  for (const t1 of topics) {
                    client.subscribe(
                      t1,
                      1,
                      null,
                      // @ts-expect-error Java类型
                      new IMqttActionListener({
                        onSuccess: (token) => {
                          console.log(`MQTT 订阅成功->${t1}`)
                        },
                        onFailure: (token, error) => {
                          console.error(`MQTT 订阅失败 ${error}`)
                        },
                      }),
                    )
                  }
                } finally {
                  console.log(`设备信息已载入${id}`)
                  device.device_latch.countDown()
                }
              }
              break
            }
          }
        }
      },
    })
  client.setCallback(callback)
  const publishTokens = []
  const publish = (topic, msg, qos = 1, retained = true) => {
    // publish message
    try {
      const javaString = new java.lang.String(msg)
      const byteArray = javaString.getBytes('UTF-8')
      const token = client.publish(topic, byteArray, qos, retained)
      publishTokens.push(token)
      console.log(`MQTT 发布成功->${topic}`)
    } catch (error) {
      console.error('MQTT 发布失败', error)
    }
  }

  const publishSgccHassDiscovery = (电表信息: SgccInfoJson) => {
    const sgcc_device = {
      identifiers: `sgcc_${电表信息.id}`,
      name: `未命名国家电网电表编号${电表信息.id}`,
      manufacturer: '国家电网',
      model: 'com.sgcc.wsgw.cn',
    }
    const days = Object.keys(电表信息.data)
    let daylist = []

    // 层级   字段名   数据类型   说明   是否必填
    // 实体 ID   entity_id   字符串   插件选中的用电统计实体（如 sensor.electric_usage）   是
    // 属性   daylist   数组   日用电明细列表   是（日数据）
    // daylist 子项   day   字符串   日期（格式：YYYY-MM-DD）   是
    // daylist 子项   dayTPq   数值   尖峰用电量（度）   否
    // daylist 子项   dayPPq   数值   高峰用电量（度）   否
    // daylist 子项   dayNPq   数值   平段用电量（度）   否
    // daylist 子项   dayVPq   数值   低谷用电量（度）   否
    // daylist 子项   dayEleNum   数值   当日总用电量（度）   是
    // daylist 子项   dayEleCost   数值   当日电费（元）   是
    // 属性   monthlist   数组   月用电明细列表   是（月数据）
    // monthlist 子项   month   字符串   月份（格式：YYYY-MM）   是
    // monthlist 子项   monthTPq   数值   月尖峰用电量（度）   否
    // monthlist 子项   monthPPq   数值   月高峰用电量（度）   否
    // monthlist 子项   monthNPq   数值   月平段用电量（度）   否
    // monthlist 子项   monthVPq   数值   月低谷用电量（度）   否
    // monthlist 子项   monthEleNum   数值   当月总用电量（度）   是
    // monthlist 子项   monthEleCost   数值   当月电费（元）   是
    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      const day_data = 电表信息.data[day]
      let dayEleCost2 = new Big(0.0)
      if (电表信息.电价价目表.峰谷电) {
        let 谷电费 = new Big(day_data.谷)
        if (谷电费.gt(0)) {
          谷电费 = 谷电费.times(new Big(电表信息.电价价目表.当前谷电价))
        }
        let 峰电费 = new Big(day_data.峰).times(new Big(电表信息.电价价目表.当前峰电价))
        if (峰电费.gt(0)) {
          峰电费 = 峰电费.times(new Big(电表信息.电价价目表.当前峰电价))
        }
        let 平电费 = new Big(day_data.平).times(new Big(电表信息.电价价目表.当前平电价))
        if (平电费.gt(0)) {
          平电费 = 平电费.times(new Big(电表信息.电价价目表.当前平电价))
        }
        let 尖电费 = new Big(day_data.尖).times(new Big(电表信息.电价价目表.当前尖电价))
        if (尖电费.gt(0)) {
          尖电费 = 尖电费.times(new Big(电表信息.电价价目表.当前尖电价))
        }
        dayEleCost2 = 谷电费.plus(峰电费).plus(平电费).plus(尖电费)
      }
      daylist[i] = {
        day,
        dayTPq: Number.parseFloat(电表信息.data[days[i]].尖),
        dayPPq: Number.parseFloat(电表信息.data[days[i]].峰),
        dayNPq: Number.parseFloat(电表信息.data[days[i]].平),
        dayVPq: Number.parseFloat(电表信息.data[days[i]].谷),
        dayEleNum: Number.parseFloat(day_data.power),
        dayEleCost: Number.parseFloat(dayEleCost2.toFixed(3)),
      }
    }
    // 日期排序 都是.day的元素 格式2026-01-01 我希望最新的数据在最前面
    daylist = daylist.sort((a, b) => {
      return a.day > b.day ? -1 : 1
    })
    const monthlist = []
    const yearlist = []
    for (const year_name of Object.keys(电表信息.月度电费)) {
      const 年数据 = 电表信息.月度电费[year_name]
      for (const month_name of Object.keys(年数据.月份数据)) {
        const 月数据 = 年数据.月份数据[month_name]
        // 格式化月份数据 原本是YYYY年MM月
        const formattedMonth = year_name.replace('年', '-') + month_name.replace('月', '').padStart(2, '0')
        monthlist.push({
          month: formattedMonth,
          monthEleNum: Number.parseFloat(月数据.本期电量),
          monthEleCost: Number.parseFloat(月数据.本期电费),
        })
      }
      const today = new Date()
      if (!monthlist[format_date(today, 'yyyy-MM')]) {
        monthlist.push({
          month: format_date(today, 'yyyy-MM'),
          monthEleNum: Number.parseFloat(电表信息.最新数据.本月总电量),
          monthEleCost: Number.parseFloat(电表信息.最新数据.当月总电费),
        })
      }
      yearlist.push({
        year: year_name.replace('年', ''),
        yearEleNum: Number.parseFloat(年数据.年累计电量),
        yearEleCost: Number.parseFloat(年数据.年累计电费),
      })
    }

    const 价目表 = 电表信息.电价价目表
    const 计费标准类型 = 价目表.峰谷电 ? '年阶梯峰平谷' : '年阶梯'
    const 计费标准 = {
      平均单价: 电表信息.电价价目表.当前电价,
      // 当前月阶梯档: `第${价目表.当前阶梯}档`,
      当前年阶梯档: `第${价目表.当前阶梯}档`,
      计费标准: 计费标准类型,
      年阶梯第2档起始电量: 价目表.二阶起始,
      年阶梯第3档起始电量: 价目表.三阶起始,
      年阶梯累计用电量: 电表信息.最新数据.年累计电量,
      年阶梯第1档尖电价: 价目表.尖电价一阶,
      年阶梯第1档峰电价: 价目表.峰电价一阶,
      年阶梯第1档平电价: 价目表.平电价一阶,
      年阶梯第1档谷电价: 价目表.谷电价一阶,
      年阶梯第2档尖电价: 价目表.尖电价二阶,
      年阶梯第2档峰电价: 价目表.峰电价二阶,
      年阶梯第2档平电价: 价目表.平电价二阶,
      年阶梯第2档谷电价: 价目表.谷电价二阶,
      年阶梯第3档尖电价: 价目表.尖电价三阶,
      年阶梯第3档峰电价: 价目表.峰电价三阶,
      年阶梯第3档平电价: 价目表.平电价三阶,
      年阶梯第3档谷电价: 价目表.谷电价三阶,
    }
    //  模仿hassbox的传感器格式，用于兼容相关前端插件。
    publish(
      `${cfg.topic_prefix}/${电表信息.id}/hassbox`,
      JSON.stringify({
        total_power: 电表信息.最新数据.总用电量,
        daylist,
        monthlist,
        yearlist,
        name: 电表信息.name,
        计费标准,
        // previousMonthUsage: monthlist[0],
        // yearUsage: {
        //     yearEleNum: parseFloat(电表信息.最新数据.年累计电量),
        //     yearEleCost: parseFloat(电表信息.最新数据.年累计电费),
        // }
      }),
      1,
      true,
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/total_power`, 电表信息.最新数据.总用电量, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_hassbox/config`,
      JSON.stringify({
        name: 'hassbox',
        unique_id: `sgcc_${电表信息.id}_hassbox`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/last_cost`,
        // value_template: "{{ value_json['total_power'] }}",
        unit_of_measurement: '¥',
        device_class: 'monetary',
        icon: 'mdi:currency-cny',
        device: sgcc_device,
        json_attributes_topic: `${cfg.topic_prefix}/${电表信息.id}/hassbox`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_hassbox`,
        // json_attributes_template: `{
        //     "monthlist": "{{ value_json.monthlist }}",
        //     "daylist": "{{ value_json.daylist }}",
        //     "name": "{{ value_json.name }}",
        // }`,
      }),
      1,
      true,
    )
    const main = JSON.stringify({
      name: '总用电量',
      unique_id: `sgcc_${电表信息.id}_main`,
      default_entity_id: `sensor.sgcc_${电表信息.id}_main`,
      state_topic: `${cfg.topic_prefix}/${电表信息.id}/total_power`,
      // value_template: "{{ value_json['最新数据']['总用电量'] }}",
      unit_of_measurement: 'kWh',
      device_class: 'energy',
      icon: 'mdi:ev-station',
      device: sgcc_device,
    })
    //     main = main.substring(0,main.length-1) +`"\n,json_attributes_template": >-
    // {
    //     "raw": {{ value_json }},
    // }}\n`;
    publish(`homeassistant/sensor/sgcc_${电表信息.id}_main/config`, main, 1, true)
    // 写入数据最新日期
    publish(`${cfg.topic_prefix}/${电表信息.id}/latest_date`, 电表信息.最新数据.日期, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_latest_date/config`,
      JSON.stringify({
        name: '最新数据日期',
        unique_id: `sgcc_${电表信息.id}_latest_date`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_latest_date`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/latest_date`,
        icon: 'mdi:calendar',
        device: sgcc_device,
      }),
    )

    // 先写入单个数据到mqtt中
    publish(`${cfg.topic_prefix}/${电表信息.id}/daily_power`, 电表信息.最新数据.数据.power, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_daily_power/config`,
      JSON.stringify({
        name: '最新日用电',
        unique_id: `sgcc_${电表信息.id}_daily_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_daily_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/daily_power`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
      }),
      1,
      true,
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/daily_peak`, 电表信息.最新数据.数据.峰, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_daily_peak/config`,
      JSON.stringify({
        name: '最新日峰用电',
        unique_id: `sgcc_${电表信息.id}_daily_peak`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_daily_peak`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/daily_peak`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:flash',
        device: sgcc_device,
      }),
      1,
      true,
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/daily_valley`, 电表信息.最新数据.数据.谷, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_daily_valley/config`,
      JSON.stringify({
        name: '最新日谷用电',
        unique_id: `sgcc_${电表信息.id}_daily_valley`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_daily_valley`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/daily_valley`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:grain',
        device: sgcc_device,
      }),
      1,
      true,
    )

    // # ==================================================================
    // # 【新增】本月统计 (来自 JSON 中的 "最新数据" 汇总)
    // # ==================================================================
    publish(`${cfg.topic_prefix}/${电表信息.id}/month_power`, 电表信息.最新数据.本月总电量, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_month_power/config`,
      JSON.stringify({
        name: '本月总电量',
        unique_id: `sgcc_${电表信息.id}_month_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_month_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/month_power`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        icon: 'mdi:gauge',
        device: sgcc_device,
      }),
      1,
      true,
    )

    publish(`${cfg.topic_prefix}/${电表信息.id}/month_peak`, 电表信息.最新数据.本月峰电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_month_peak/config`,
      JSON.stringify({
        name: '本月峰电',
        unique_id: `sgcc_${电表信息.id}_month_peak`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_month_peak`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/month_peak`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:flash',
        device: sgcc_device,
      }),
      1,
      true,
    )

    publish(`${cfg.topic_prefix}/${电表信息.id}/month_valley`, 电表信息.最新数据.本月谷电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_month_valley/config`,
      JSON.stringify({
        name: '本月谷电',
        unique_id: `sgcc_${电表信息.id}_month_valley`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_month_valley`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/month_valley`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:grain',
        device: sgcc_device,
      }),
      1,
      true,
    )

    // 本月平电
    publish(`${cfg.topic_prefix}/${电表信息.id}/month_flat`, 电表信息.最新数据.本月平电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_month_flat/config`,
      JSON.stringify({
        name: '本月平电',
        unique_id: `sgcc_${电表信息.id}_month_flat`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_month_flat`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/month_flat`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:gauge',
        device: sgcc_device,
      }),
    )

    // 本月尖电
    publish(`${cfg.topic_prefix}/${电表信息.id}/month_tip`, 电表信息.最新数据.本月尖电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_month_tip/config`,
      JSON.stringify({
        name: '本月尖电',
        unique_id: `sgcc_${电表信息.id}_month_tip`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_month_tip`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/month_tip`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:flash',
        device: sgcc_device,
        device_class: 'energy',
      }),
    )

    // # ==================================================================
    // # 【新增】财务信息 (来自 JSON 根层级)
    // # ==================================================================
    publish(`${cfg.topic_prefix}/${电表信息.id}/owe`, 电表信息.应交金额, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_owe/config`,
      JSON.stringify({
        name: '应交金额',
        unique_id: `sgcc_${电表信息.id}_owe`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_owe`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/owe`,
        unit_of_measurement: '¥',
        device_class: 'monetary',
        icon: 'mdi:currency-cny',
        device: sgcc_device,
      }),
      1,
      true,
    )
    console.log(`账户余额：${电表信息.账户余额}元`)
    publish(`${cfg.topic_prefix}/${电表信息.id}/balance`, 电表信息.账户余额, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_balance/config`,
      JSON.stringify({
        name: '账户余额',
        unique_id: `sgcc_${电表信息.id}_balance`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_balance`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/balance`,
        unit_of_measurement: '¥',
        device_class: 'monetary',
        icon: 'mdi:wallet',
        device: sgcc_device,
      }),
      1,
      true,
    )
    console.log(`近七天累计用电量：${电表信息.近七日累计用电量}kWh`)
    publish(`${cfg.topic_prefix}/${电表信息.id}/week_power`, 电表信息.近七日累计用电量, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_week_power/config`,
      JSON.stringify({
        name: '近七日用电',
        unique_id: `sgcc_${电表信息.id}_week_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_week_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/week_power`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:chart-line',
        device: sgcc_device,
      }),
      1,
      true,
    )
    // # ====================================   ==============================
    // # 【新增】年累计与上期数据
    // # ==================================================================
    publish(`${cfg.topic_prefix}/${电表信息.id}/last_power`, 电表信息.上期电量, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_last_power/config`,
      JSON.stringify({
        name: '上期电量',
        unique_id: `sgcc_${电表信息.id}_last_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_last_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/last_power`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
      }),
      1,
      true,
    )
    console.log(`上期电量：${电表信息.上期电量}kWh`)

    publish(`${cfg.topic_prefix}/${电表信息.id}/last_cost`, 电表信息.上期电费, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_last_cost/config`,
      JSON.stringify({
        name: '上期电费',
        unique_id: `sgcc_${电表信息.id}_last_cost`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_last_cost`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/last_cost`,
        unit_of_measurement: '¥',
        device_class: 'monetary',
        icon: 'mdi:receipt',
        device: sgcc_device,
      }),
      1,
      true,
    )
    console.log(`上期电费：${电表信息.上期电费}元`)
    publish(`${cfg.topic_prefix}/${电表信息.id}/year_cost`, 电表信息.最新数据.年累计电费, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_year_cost/config`,
      JSON.stringify({
        name: '年累计电费',
        unique_id: `sgcc_${电表信息.id}_year_cost`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_year_cost`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/year_cost`,
        unit_of_measurement: '¥',
        device_class: 'monetary',
        device: sgcc_device,
      }),
      1,
      true,
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/year_power`, 电表信息.最新数据.年累计电量, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_year_power/config`,
      JSON.stringify({
        name: '年累计电量',
        unique_id: `sgcc_${电表信息.id}_year_pwer`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_year_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/year_power`,
        unit_of_measurement: 'kWh',
        icon: 'mdi:transmission-tower',
        device_class: 'energy',
        device: sgcc_device,
      }),
      1,
      true,
    )
    // 预计电费
    publish(`${cfg.topic_prefix}/${电表信息.id}/except_current_month_cost`, 电表信息.最新数据.预计本月总电费, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_except_current_month_cost/config`,
      JSON.stringify({
        name: '预计本月总电费',
        unique_id: `sgcc_${电表信息.id}_except_current_month_cost`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_except_current_month_cost`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/except_current_month_cost`,
        unit_of_measurement: '¥',
        device_class: 'monetary',
        icon: 'mdi:receipt',
        device: sgcc_device,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/except_current_month_power`, 电表信息.最新数据.预计本月用电量, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_except_current_month_power/config`,
      JSON.stringify({
        name: '预计本月用电量',
        unique_id: `sgcc_${电表信息.id}_except_current_month_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_except_current_month_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/except_current_month_power`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
        state_class: 'total',
        entity_category: 'diagnostic',
      }),
    )
    // 电表信息.最新数据.预计本月尖电;
    publish(`${cfg.topic_prefix}/${电表信息.id}/except_current_month_tip_power`, 电表信息.最新数据.预计本月尖电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_except_current_month_tip_power/config`,
      JSON.stringify({
        name: '预计本月尖电',
        unique_id: `sgcc_${电表信息.id}_except_current_month_tip_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_except_current_month_tip_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/except_current_month_tip_power`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
        state_class: 'total',
        entity_category: 'diagnostic',
      }),
    )
    // 电表信息.最新数据.预计本月峰电;
    publish(`${cfg.topic_prefix}/${电表信息.id}/except_current_month_peak_power`, 电表信息.最新数据.预计本月峰电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_except_current_month_peak_power/config`,
      JSON.stringify({
        name: '预计本月峰电',
        unique_id: `sgcc_${电表信息.id}_except_current_month_peak_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_except_current_month_peak_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/except_current_month_peak_power`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
        state_class: 'total',
        entity_category: 'diagnostic',
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/except_current_month_mid_power`, 电表信息.最新数据.预计本月平电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_except_current_month_mid_power/config`,
      JSON.stringify({
        name: '预计本月平电',
        unique_id: `sgcc_${电表信息.id}_except_current_month_mid_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_except_current_month_mid_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/except_current_month_mid_power`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
        state_class: 'total',
        entity_category: 'diagnostic',
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/except_current_month_low_power`, 电表信息.最新数据.预计本月谷电, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_except_current_month_low_power/config`,
      JSON.stringify({
        name: '预计本月谷电',
        unique_id: `sgcc_${电表信息.id}_except_current_month_low_power`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_except_current_month_low_power`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/except_current_month_low_power`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
        state_class: 'total',
        entity_category: 'diagnostic',
      }),
    )
    // 预计本月分时电费差价
    publish(`${cfg.topic_prefix}/${电表信息.id}/except_current_month_power_difference`, 电表信息.最新数据.预计本月分时价格差, 1, true)
    publish(
      `homeassistant/sensor/sgcc_${电表信息.id}_except_current_month_power_difference/config`,
      JSON.stringify({
        name: '预计本月分时电费差价',
        unique_id: `sgcc_${电表信息.id}_except_current_month_power_difference`,
        default_entity_id: `sensor.sgcc_${电表信息.id}_except_current_month_power_difference`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/except_current_month_power_difference`,
        unit_of_measurement: '¥',
        device_class: 'monetary',
        icon: 'mdi:transmission-tower',
        device: sgcc_device,
        state_class: 'total',
        entity_category: 'diagnostic',
      }),
    )
    // 增加电力设置控件
    /*
        {
    "电价一阶": "0.5080",
    "谷电价一阶": "0.2880",
    "峰电价一阶": "0.5680",
    "电价二阶": "0.588",
    "谷电价二阶": "0.618",
    "峰电价二阶": "0.338",
    "电价三阶": "0.838",
    "谷电价三阶": "0.868",
    "峰电价三阶": "0.588",
    "当前谷电价": "0.2880",
    "当前峰电价": "0.5680",
    "当前阶梯": 1,
    "峰谷电": true,
    "当前电价": "0.5080",
    "尖电价一阶": "0.5",
    "平电价一阶": "0.5",
    "尖电价二阶": "0.5",
    "平电价二阶": "0.5",
    "尖电价三阶": "0.5",
    "平电价三阶": "0.5",
    "当前尖电价": "0.5",
    "当前平电价": "0.5",
    "二阶起始": 2761,
    "三阶起始": 4801
}
        */
    publish(`${cfg.topic_prefix}/${电表信息.id}/l1price`, 价目表.电价一阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l1price/config`,
      JSON.stringify({
        name: '设置 电价一阶（无峰谷）',
        unique_id: `sgcc_${电表信息.id}_l1price`,
        default_entity_id: `number.sgcc_${电表信息.id}_l1price`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price`,
        unit_of_measurement: '¥/kWh',
        platform: 'number',
        device_class: 'monetary',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l2price`, 价目表.电价二阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l2price/config`,
      JSON.stringify({
        name: '设置 电价二阶（无峰谷）',
        unique_id: `sgcc_${电表信息.id}_l2price`,
        default_entity_id: `number.sgcc_${电表信息.id}_l2price`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l1price_feng`, 价目表.峰电价一阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l1price_feng/config`,
      JSON.stringify({
        name: '设置 峰电价一阶',
        unique_id: `sgcc_${电表信息.id}_l1price_feng`,
        default_entity_id: `number.sgcc_${电表信息.id}_l1price_feng`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price_feng`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price_feng`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l1price_gu`, 价目表.谷电价一阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l1price_gu/config`,
      JSON.stringify({
        name: '设置 谷电价一阶',
        unique_id: `sgcc_${电表信息.id}_l1price_gu`,
        default_entity_id: `number.sgcc_${电表信息.id}_l1price_gu`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price_gu`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price_gu`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l1price_ping`, 价目表.平电价一阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l1price_ping/config`,
      JSON.stringify({
        name: '设置 平电价一阶',
        unique_id: `sgcc_${电表信息.id}_l1price_ping`,
        default_entity_id: `number.sgcc_${电表信息.id}_l1price_ping`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price_ping`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l1price_ping`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l2price_jian`, 价目表.尖电价一阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l2price_jian/config`,
      JSON.stringify({
        name: '设置 尖电价一阶',
        unique_id: `sgcc_${电表信息.id}_l2price_jian`,
        default_entity_id: `number.sgcc_${电表信息.id}_l2price_jian`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_jian`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_jian`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l2price_feng`, 价目表.峰电价二阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l2price_feng/config`,
      JSON.stringify({
        name: '设置 峰电价二阶',
        unique_id: `sgcc_${电表信息.id}_l2price_feng`,
        default_entity_id: `number.sgcc_${电表信息.id}_l2price_feng`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_feng`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_feng`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l2price_gu`, 价目表.谷电价二阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l2price_gu/config`,
      JSON.stringify({
        name: '设置 谷电价二阶',
        unique_id: `sgcc_${电表信息.id}_l2price_gu`,
        default_entity_id: `number.sgcc_${电表信息.id}_l2price_gu`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_gu`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_gu`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l2price_ping`, 价目表.平电价二阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l2price_ping/config`,
      JSON.stringify({
        name: '设置 平电价二阶',
        unique_id: `sgcc_${电表信息.id}_l2price_ping`,
        default_entity_id: `number.sgcc_${电表信息.id}_l2price_ping`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_ping`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_ping`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l2price_jian`, 价目表.尖电价二阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l2price_jian/config`,
      JSON.stringify({
        name: '设置 尖电价二阶',
        unique_id: `sgcc_${电表信息.id}_l2price_jian`,
        default_entity_id: `number.sgcc_${电表信息.id}_l2price_jian`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_jian`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l2price_jian`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l3price_feng`, 价目表.峰电价三阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l3price_feng/config`,
      JSON.stringify({
        name: '设置 峰电价三阶',
        unique_id: `sgcc_${电表信息.id}_l3price_feng`,
        default_entity_id: `number.sgcc_${电表信息.id}_l3price_feng`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_feng`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_feng`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l3price_gu`, 价目表.谷电价三阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l3price_gu/config`,
      JSON.stringify({
        name: '设置 谷电价三阶',
        unique_id: `sgcc_${电表信息.id}_l3price_gu`,
        default_entity_id: `number.sgcc_${电表信息.id}_l3price_gu`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_gu`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_gu`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l3price_ping`, 价目表.平电价三阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l3price_ping/config`,
      JSON.stringify({
        name: '设置 平电价三阶',
        unique_id: `sgcc_${电表信息.id}_l3price_ping`,
        default_entity_id: `number.sgcc_${电表信息.id}_l3price_ping`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_ping`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_ping`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l3price_jian`, 价目表.尖电价三阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l3price_jian/config`,
      JSON.stringify({
        name: '设置 尖电价三阶',
        unique_id: `sgcc_${电表信息.id}_l3price_jian`,
        default_entity_id: `number.sgcc_${电表信息.id}_l3price_jian`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_jian`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price_jian`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l3price`, 价目表.电价三阶, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l3price/config`,
      JSON.stringify({
        name: '设置 电价三阶（无峰谷）',
        unique_id: `sgcc_${电表信息.id}_l3price`,
        default_entity_id: `number.sgcc_${电表信息.id}_l3price`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price`,
        unit_of_measurement: '¥/kWh',
        device_class: 'monetary',
        platform: 'number',
        icon: 'mdi:currency-cny',
        min: 0.01,
        max: 100.0,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l3price`,
        retain: true,
        mode: 'box',
        step: 0.01,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l2cost_start`, 价目表.二阶起始, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l2cost_start/config`,
      JSON.stringify({
        name: '设置 电价二阶起始度数',
        unique_id: `sgcc_${电表信息.id}_l2cost_start`,
        default_entity_id: `number.sgcc_${电表信息.id}_l2cost_start`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l2cost_start`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        platform: 'number',
        icon: 'mdi:counter',
        min: 1,
        max: 1000000,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l2cost_start`,
        retain: true,
        mode: 'box',
        step: 1,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/l3cost_start`, 价目表.三阶起始, 1, true)
    publish(
      `homeassistant/number/sgcc_${电表信息.id}_l3cost_start/config`,
      JSON.stringify({
        name: '设置 电价三阶起始度数',
        unique_id: `sgcc_${电表信息.id}_l3cost_start`,
        default_entity_id: `number.sgcc_${电表信息.id}_l3cost_start`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/l3cost_start`,
        unit_of_measurement: 'kWh',
        device_class: 'energy',
        platform: 'number',
        icon: 'mdi:counter',
        min: 1,
        max: 1000000,
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/l3cost_start`,
        retain: true,
        mode: 'box',
        step: 1,
      }),
    )
    publish(`${cfg.topic_prefix}/${电表信息.id}/fenggu_enable`, 价目表.峰谷电, 1, true)
    publish(
      `homeassistant/switch/sgcc_${电表信息.id}_fenggu_enable/config`,
      JSON.stringify({
        name: '设置 是否启用峰谷电定价',
        unique_id: `sgcc_${电表信息.id}_fenggu_enable`,
        default_entity_id: `switch.sgcc_${电表信息.id}_fenggu_enable`,
        state_topic: `${cfg.topic_prefix}/${电表信息.id}/fenggu_enable`,
        platform: 'switch',
        icon: 'mdi:power-plug',
        device: sgcc_device,
        command_topic: `${cfg.topic_prefix}/${电表信息.id}/fenggu_enable`,
        state_off: false,
        state_on: true,
        payload_on: true,
        payload_off: false,
        retain: true,
      }),
    )
    // 注释写一下上面的switch控件和number控件的topic后缀 例如fenggu_enable
    //
  }
  const 默认电价价目表: ElectricityPriceList = {
    一阶电价: 0.538,
    电价一阶: 0.508,
    谷电价一阶: 0.288,
    峰电价一阶: 0.568,
    // 0.588 0.618 0.338
    电价二阶: 0.588,
    谷电价二阶: 0.618,
    峰电价二阶: 0.338,
    // 0.838 0.868 0.588
    电价三阶: 0.838,
    谷电价三阶: 0.868,
    峰电价三阶: 0.588,
    // 2769, 2760-4800, 4801以上 这是阶梯等级。
    // "一阶范围": "<2761",
    // "二阶范围": "2761-4801",
    // "三阶范围": ">4801",
    当前谷电价: 0.0,
    当前峰电价: 0.0,
    当前阶梯: 1,
    峰谷电: true,
    当前电价: 0.5,
    尖电价一阶: 0.5,
    平电价一阶: 0.5,
    尖电价二阶: 0.5,
    平电价二阶: 0.5,
    尖电价三阶: 0.5,
    平电价三阶: 0.5,
    当前尖电价: 0.5,
    当前平电价: 0.5,
    二阶起始: 2761,
    三阶起始: 4801,
  }
  // 增加一个运行时间统计，运行结束的时候提示，使用JAVA的运行时间类型。
  const startTime = java.lang.System.nanoTime()
  const lock = threads.lock()
  const complete = lock.newCondition()
  client.connect(
    mqttConnectOptions,
    null,
    // @ts-expect-error 忽略类型检查
    new IMqttActionListener({
      onSuccess: () => {
        threads.start(() => {
          try {
            subscribeToTopic(`${cfg.topic_prefix}/device_info`)
            console.log('mqtt 连接成功')
            // subscribeToTopic();
            console.log('开始获取数据')
            // 等待10秒获取mqtt数据
            console.log('等待10秒获取mqtt数据')
            latch_1.await(10000, java.util.concurrent.TimeUnit.MILLISECONDS)
            const devices = Object.keys(mqtt_devices)
            if (devices.length == 0) {
              console.log('没有设备，可能是获取失败或者未曾订阅过设备。')
              isTimeout = true
            } else {
              console.log(`等待设备数据就绪，请耐心等待。`)
              for (const dn of devices) {
                const deviceX = mqtt_devices[dn]
                console.log(`等待设备 ${dn} 数据就绪，请耐心等待。`)
                deviceX.device_latch.await(10000, java.util.concurrent.TimeUnit.MILLISECONDS)
                deviceX.types_latch.await(5000, java.util.concurrent.TimeUnit.MILLISECONDS)
                deviceX.is_timeout = true
                if (mqtt_data[dn]) {
                  console.log(`设备 ${dn} 数据就绪`)
                } else {
                  console.log(`设备 ${dn} 数据获取超时`)
                }
              }
            }
            const data = queryData(mqtt_data, cfg)
            client.unsubscribe(`${cfg.topic_prefix}/+`)
            for (const index in data) {
              const 电表信息: SgccInfoJson = data[index]
              const topic = `${cfg.topic_prefix}/${电表信息.id}`
              console.log('发布数据', topic)
              // 1. 获取 data 对象中的所有日期键
              const dates = Object.keys(电表信息.data)

              // 2. 对日期进行排序（字符串排序对于 YYYY-MM-DD 格式是有效的）
              dates.sort()

              // 3. 获取最后一个日期（即最新的日期）
              const latestDateKey = dates[dates.length - 1]

              // 4. 获取最新日期的具体数据对象
              const latestDayData = 电表信息.data[latestDateKey]

              // 5. 遍历

              电表信息['最新数据'] = {
                日期: latestDateKey,
                数据: latestDayData,
                本月谷电: '0.0',
                本月尖电: '0.0',
                本月平电: '0.0',
                本月峰电: '0.0',
                本月总电量: '0.0',
                总用电量: '0.0',
                总电费量: '0.0',
                // "预计本月电费": 0.0,
                预计本月谷电: '0.0',
                预计本月尖电: '0.0',
                预计本月平电: '0.0',
                预计本月峰电: '0.0',
                预计本月总电费: '0.0',
                预计本月用电量: '0.0',
                年累计电费: '0.0',
                年累计电量: '0.0',
                当月峰电电费: '0.0',
                当月谷电电费: '0.0',
                预计本月电费: '0.0',
                当月总电费: '0.0',
                当月平电电费: '0.0',
                当月尖电电费: '0.0',
                预计本月分时价格差: '0.0',
              }

              try {
                client.unsubscribe(`${topic}/+`)
              } catch (e) {
                console.log(e)
              }
              // client
              if (电表信息['电价价目表'] != null) {
                const mqtt电价价格表 = 电表信息['电价价目表']
                电表信息['电价价目表'] = { ...默认电价价目表, ...mqtt电价价格表 }
              } else {
                电表信息['电价价目表'] = 默认电价价目表
              }
              queryMonthExtData(电表信息)
              publish(`${topic}/electricity_price`, JSON.stringify(电表信息['电价价目表'], null, 0), 1, true)
              console.log('发布数据', `${topic}/electricity_price`)
              publish(topic, JSON.stringify(电表信息, null, 0), 1, true)
              console.log('发布数据', topic)
              // 发布homeassistant 自动发现数据
              publishSgccHassDiscovery(电表信息)
              // let topic = `${cfg.mqtt_topic}/${cfg.username}/${cfg.password}/${cfg.device_id}/${cfg.device_name}/${cfg.device_type}/${cfg.device_location}/${cfg.device_model}/${cfg.device_serial}/${cfg.device_manufacturer}/${cfg.device_firmware_version}/${cfg.device_hardware_version}/${cfg.device_}
            }
            // //结束前循环等待tokens
            // for(let item of publishTokens){
            //     try{
            //         console.log('等待MQTT消息发布完毕', item.getTopic());
            //         item.waitForCompletion(1000);
            //         console.log('MQTT消息发布完毕', item.getTopic());
            //     }catch(e){
            //         console.log(e)
            //     }
            // }
            // 等待MQTT消息发布完毕
            sleep(10000)
            console.log('MQTT消息发布完毕，准备退出脚本。')
            client.disconnect()
            // client.close();
            console.log('任务结束')
          } finally {
            stopApp()
            if (waitThread) {
              lock.lock()
              complete.signal()
              lock.unlock()
            }
          }
        })
      },
      onFailure: (token, error) => {
        console.error('mqtt 连接失败', error)
        // exit();
      },
    }),
  )
  if (waitThread) {
    lock.lock()
    complete.await()
    lock.unlock()
    // console.log('任务执行完毕，线程结束。')
    // 展示运行时间
    const runTime = java.lang.System.nanoTime() - startTime
    // 要转换为可读格式 分秒毫秒 原本的是纳秒
    console.log(`任务运行完成，花费 ${formatNanoToTime(runTime)} 。`)
  }
}

function run() {
  try {
    const cfg = loadConfig()
    autoApplyRequest(cfg)
    toastLog('开始运行网上国网任务')
    startApp()
    waitForActivity(mainActivityName)
    sleep(realr.int(3000, 8000))
    skipAd()
    sleep(realr.int(500, 1500))
    const sign = className('android.view.ViewGroup').desc('签到').findOne(5000)
    if (sign) {
      sleep(realr.int(500, 1500))
      console.log('已点击「签到」按钮')
      click(sign.bounds().centerX(), sign.bounds().centerY())
      sleep(realr.int(500, 1500))
    }
    sleep(15000)
  } finally {
    创建GKD快照()
    stopApp()
  }
}

export { publishSgccData, queryData, queryMonthData, queryPowerData, run, startApp, stopApp, test }
