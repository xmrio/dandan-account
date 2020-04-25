import uCharts from '../u-charts'
import { parseTime } from '../../util'

let lineChart = null
Page({

  /**
   * 页面的初始数据
   */
  data: {
    targetInfo: {},
    progress: {},
    screenWidth: getApp().globalData.screenWidth,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.getTargetInfo()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },
  getTargetInfo() {
    const self = this
    wx.cloud.callFunction({
      name: 'target',
      data: {
        mode: 'targetInfo',
      },
      success(res) {
        if (res.result.code === 1) {
          const targetInfo = res.result.data
          const allDate = self.getDates(new Date(targetInfo.targetData.createTime), new Date(targetInfo.targetData.endDate))
          const toFinishDate = self.getDates(new Date(), new Date(targetInfo.targetData.endDate))
          self.setData({
            targetInfo,
            progress: {
              percentage: (toFinishDate.length / allDate.length).toFixed(2),
              passDay: toFinishDate.length,
              allDay: allDate.length,
            },
          })
          self.renderChart(targetInfo.targetData, targetInfo.billList, allDate)
        }
      },
    })
  },
  renderChart(targetData, billList, allDate) {
    const self = this
    // 处理账单，按每天进行保存
    const formatBillList = {}
    const formatAllDate = allDate.map((item) => parseTime(item, '{y}-{m}-{d}'))
    const lastBillDate = parseTime(billList[billList.length - 1].noteDate, '{y}-{m}-{d}')
    const lastBillDateIndex = formatAllDate.indexOf(lastBillDate)

    billList.forEach((bill) => {
      formatAllDate.forEach((day, index) => {
        if (index <= lastBillDateIndex) {
          if (day === parseTime(bill.noteDate, '{y}-{m}-{d}')) {
            if (!formatBillList[day]) formatBillList[day] = 0
            formatBillList[day] = bill.flow === 0 ? formatBillList[day] -= bill.money : formatBillList[day] += bill.money
          } else {
            formatBillList[day] = 0
          }
        }
      })
    })
    const keys = Object.keys(formatBillList)
    const seriesData = []
    for (let i = 0; i < formatAllDate.length; i++) {
      if (i <= lastBillDateIndex) {
        if (i === 0) {
          formatBillList[keys[i]] += targetData.startMoney
        } else {
          formatBillList[keys[i]] += formatBillList[keys[i - 1]]
        }
        seriesData.push(formatBillList[keys[i]])
      }
    }
    lineChart = new uCharts({
      $this: self,
      canvasId: 'linechart',
      type: 'area',
      fontSize: 11,
      legend: {
        show: false,
      },
      dataLabel: false,
      dataPointShape: false,
      enableMarkLine: true,
      background: 'rgba(255, 255, 255, 0)',
      pixelRatio: 1,
      categories: keys,
      padding: [23, 0, 0, 0],
      series: [
        {
          color: '#E9EBF3',
          data: seriesData,
          index: 0,
          legendShape: 'line',
          name: '',
          pointShape: 'circle',
          show: true,
          type: 'line',
          addPoint: true,
        },
      ],
      animation: true,
      enableScroll: true, // 开启图表拖拽功能
      xAxis: {
        disableGrid: true,
        type: 'grid',
        gridType: 'dash',
        itemCount: 4,
        scrollShow: false,
        scrollAlign: 'left',
        disabled: true,
        gridColor: '#3F4D8D',
        axisLineColor: '#3F4D8D',
        // scrollBackgroundColor:'#F7F7FF',//可不填写，配合enableScroll图表拖拽功能使用，X轴滚动条背景颜色,默认为 #EFEBEF
        // scrollColor:'#DEE7F7',//可不填写，配合enableScroll图表拖拽功能使用，X轴滚动条颜色,默认为 #A6A6A6
      },
      yAxis: {
        // disabled:true
        gridType: 'solid',
        dashLength: 1,
        gridColor: '#3F4D8D',
        data: [{
          axisLineColor: '#3F4D8D',
          fontColor: '#7D87B5',
          max: targetData.targetMoney,
        }],
        format: (val) => val, // 如不写此方法，Y轴刻度默认保留两位小数
      },
      width: getApp().globalData.screenWidth * 0.8,
      height: 150,
      extra: {
        line: {
          type: 'straight',
        },
        area: {
          opacity: 0.3,
          gradient: true,
          addLine: true,
        },
        markLine: {
          data: [{
            value: targetData.targetMoney,
            color: '#4fd69c',
            lineColor: '#4fd69c',
            dashLength: 1,
          }],
          type: 'dash',
        },
      },
    })
    // eslint-disable-next-line no-console
    console.log('lineChart', lineChart)
  },
  getDates(startDate, endDate) {
    const dates = []
    let currentDate = startDate

    function addDays(days) {
      const date = new Date(this.valueOf())
      date.setDate(date.getDate() + days)
      return date
    }
    while (currentDate <= endDate) {
      dates.push(currentDate)
      currentDate = addDays.call(currentDate, 1)
    }
    // 发现少了一天，再推一下
    dates.push(currentDate)
    return dates
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
})
