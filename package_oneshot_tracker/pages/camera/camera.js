const cameraBusiness = require('../../utils/cameraBusiness.js')
// 画布id
const canvasId = 'canvas1';

Page({
  data: {
    menuButtonTop: 32,
    menuButtonHeight: 33,
    frameShow:false,
    frameX:0,
    frameY:0,
    frameWidth:0,
    frameHeight:0,
    patternImageUrl: 'https://m.sanyue.red/wechat/imgs/image_pattern_1.jpg',
  },
  onReady() {
    console.log('onReady')
    var _that = this
    // 获取小程序右上角胶囊按钮的坐标，用作自定义导航栏。
    const menuButton = wx.getMenuButtonBoundingClientRect()

    this.setData({
      // 胶囊按钮与手机屏幕顶端的间距
      menuButtonTop: menuButton.top,
      // 胶囊按钮的高度
      menuButtonHeight: menuButton.height,
    })

    // 获取画布组件
    wx.createSelectorQuery()
      .select('#' + canvasId)
      .node()
      .exec(res => {
        // 画布组件
        const canvas1  = res[0].node
        // 启动AR会话
        cameraBusiness.initEnvironment(canvas1)
        // 创建AR的坐标系
        cameraBusiness.initWorldTrack(_that)
      })

  },
  onUnload() {
    console.log('onUnload')
    // 将对象回收
    cameraBusiness.dispose()
   
  },
  // 后退按钮的点击事件
  backBtn_callback() {
    wx.navigateBack()
  },
});
