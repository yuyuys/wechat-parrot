//index.js
const app = getApp()

const defaultName = '你好.mp3'
const defaultPath = 'cloud://yingwu-wqbbf.7969-yingwu-wqbbf-1301057217/nihao.mp3'

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    //播放器数据
    voiceName: defaultName,
    fileVoice: defaultPath,  //文件音频源地址
    innerAudioContext: null,
    intervalID: null,
    countDownTimer: 1,   //倒计时剩余次数
    settingCounDown: 1,  //设置重复的次数
    countDownInterval: 2000,
    bPlaying: false,
    //录音数据
    recordManager: null,
    recordVoice: null,       //录音音频源地址
    bRecording : false,
    bUseRecordVoice: false,
    //后台播放
    bBGPlaying: false,
  },

  onLoad: function() {
    let that = this

    this.setData({
      voiceName: defaultName,
      countDownTimer: 1,
      countDownInterval: 2000,
    })
    //音频播放器
    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.autoPlay = false
    innerAudioContext.src = defaultPath
    innerAudioContext.onPlay(() => {
      that.setData({
        bPlaying: true
      })
    })
    innerAudioContext.onStop(() => {
      that.setData({
        bPlaying: false
      })
    })
    this.data.innerAudioContext = innerAudioContext

    // 录音
    let recorderManager = wx.getRecorderManager()
    recorderManager.onStart(() => {
      that.setData({
        bRecording: true
      })
      wx.showToast({
        title: "录音中",
        image: "../../images/microphone.png" ,
        duration: 30000//先定义个60秒，后面可以手动调用wx.hideToast()隐藏
      })
    })
    recorderManager.onStop((res) => {
      that.setData({
        recordVoice: res.tempFilePath,
        bRecording: false
      })
      wx.hideToast()
    })
    this.data.recordManager = recorderManager

    // 后台播放
  },


  // 选择音频
  doChooseVoice: function () {
    let that = this
    // 选择文件
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      sourceType: ["m4a", "aac", "mp3", "wav"],
      success: function (res) {
        that.setData({
          voiceName: res.tempFiles[0].name,
          fileVoice: res.tempFiles[0].path,
        })
        let innerAudioContext = that.data.innerAudioContext
        innerAudioContext.autoPlay = false
        innerAudioContext.src = res.tempFiles[0].path
        that.data.innerAudioContext = innerAudioContext
      },
    })
  },

  onInputCount(event) {
    const num = event.detail.value.trim()
    this.setData({
      countDownTimer: num,
      settingCounDown: num
    })
  },

  onInputInterval(event) {
    this.setData({
      countDownInterval: event.detail.value.trim() * 1000
    })
  },
  

  // 播放音频
  doPlayVoice: function () {
    if (this.data.countDownTimer < 1 || this.data.countDownInterval < 2000) {
      this.data.countDownTimer = 1
      this.data.countDownInterval = 2000
    }

    const settingNum = this.data.settingCounDown
    this.setData({
      countDownTimer: settingNum
    })

    if (this.data.countDownInterval < this.data.innerAudioContext.duration + 200) {
      this.data.countDownInterval = this.data.innerAudioContext.duration + 200
    }
      
    this.data.innerAudioContext.play()
    this.countDown()
    this.setData({
      bPlaying : true
    })
  },

  doStopPlayVoice: function () {
    this.data.innerAudioContext.stop()
    clearInterval(this.data.intervalID)
    this.data.intervalID = null
    this.setData({
      bPlaying : false
    })
  },

  countDown: function () {
    let that = this
    let countDownSec = that.data.countDownTimer
    const interval = that.data.countDownInterval

    const intervalId = setInterval(() => {
      countDownSec--;  

      if (countDownSec <= 0) {
        that.data.innerAudioContext.stop()

        clearInterval(that.data.intervalID)
        that.data.intervalID = null
        that.setData({
          bPlaying: false
        })
      } else {  
        that.setData({
          countDownTimer: countDownSec
        })

        that.data.innerAudioContext.play()
      }
    }, interval)

    this.data.intervalID = intervalId
  },

  doRecordVoice: function () {
    const options = {
      duration: 10000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'aac',
      frameSize: 50
    }
    
    this.data.recordManager.start(options)
    this.setData({
      bRecording : true
    })
  },

  doCancelRecordVoice: function () {
    this.data.recordManager.stop()
    this.setData({
      bRecording : false
    })
  },

  doUseRecordVoice: function () {
    let innerAudioContext = this.data.innerAudioContext
    innerAudioContext.autoPlay = false
    innerAudioContext.src = this.data.recordVoice
    this.data.innerAudioContext = innerAudioContext
    this.setData({
      voiceName: '自己的录音',
      bUseRecordVoice: true,
    })
  },

  doNotRecordVoice: function () {
    let innerAudioContext = this.data.innerAudioContext
    innerAudioContext.autoPlay = false
    innerAudioContext.src = defaultPath
    this.data.innerAudioContext = innerAudioContext
    this.setData({
      voiceName: defaultName,
      bUseRecordVoice: false,
    })
  },

  // 后台播放
  doPlayVoiceBG: function () {
    const num = this.data.settingCounDown
    this.setData({
      bBGPlaying : true,
      countDownTimer: num
    })
    this.repeatPlayVoiceBG()
  },
  repeatPlayVoiceBG: function () {
    let that = this
    
    const backgroundAudioManager = wx.getBackgroundAudioManager()

    //检测是否已经点击停止
    if (this.data.bBGPlaying == false) {
      backgroundAudioManager.stop()
      return
    }

    backgroundAudioManager.title = '教鹦鹉说话'
    backgroundAudioManager.epname = '教鹦鹉说话'
    backgroundAudioManager.singer = '标准女声'
    //backgroundAudioManager.coverImgUrl = '../../images/parrot.png'
    // 设置了 src 之后会自动播放
    //backgroundAudioManager.src = defaultPath

    if (this.data.bUseRecordVoice) {
      backgroundAudioManager.src = this.data.recordVoice
    } else {
      backgroundAudioManager.src = this.data.fileVoice
    }

    backgroundAudioManager.onEnded( ()=> {
      let countDownSec = that.data.countDownTimer
      countDownSec--
      if (countDownSec > 0) {
        that.setData({
          countDownTimer: countDownSec
        })
        that.repeatPlayVoiceBG()
      } else {
        that.setData({
          bBGPlaying : false
        })
      }
    })
    backgroundAudioManager.onStop( ()=> {
      that.setData({
        bBGPlaying : false
      })
    })

    backgroundAudioManager.play()
  },

  doStopPlayVoiceBG: function () {
    const backgroundAudioManager = wx.getBackgroundAudioManager()
    backgroundAudioManager.stop()
    this.setData({
      bBGPlaying : false
    })
  },
})
