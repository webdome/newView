const $ = require('jquery')
const _ = require('underscore')
const nanoid = require('nanoid')
// const HTMLParser = require('./htmlparser')
const html2elementTree = require('./html2elementTree')
const svd = require('simple-virtual-dom')
// const El = svd.el
const diff = svd.diff
const patch = svd.patch

_.templateSettings = {
  evaluate: /\{%([\s\S]+?)\%\}/g,
  interpolate: /\{%=([\s\S]+?)\%\}/g,
  escape: /\{%-([\s\S]+?)%\}/g
}

function templateError(template) {
  if (typeof template !== 'function' && typeof template !== 'string') {
    throw new Error('template must a function or string')
  }
}

function elError(el) {
  if (!el) {
    throw new Error('el is not defined')
  }
}

function MVVM(options = {}) {
  elError(options.el)
  templateError(options.template)

  this.$options = options
  this.$data = _.clone(options.data) || {} // 复制一份data用于合并computed 用于渲染
  // this.$computed = options.computed || {}
  this.$el = $(options.el)

  this.$template = typeof options.template === 'function' ? options.template() : typeof options.template === 'string' ? options.template : ''

  this.$lifeCircle()

  this.$beforeCreate()

  this.$mountMixins()
  this.$mountData()
  this.$mountComputed()
  this.$mountMethods()
  // 事件提取
  this.$extractEvents()
  this.$mountEvents()

  this.$beforeMount()

  this.$render()


}

$.extend(MVVM.prototype, {
  // TODO: two-way data-binding  有点麻烦 不是所有data都需要
  $mountData() {
    let data = this.$options.data;
    for (const key in data) {
      let value = data[key]
      if (typeof value !== 'function') {
        this[key] = value
      } else {
        throw new Error(`${key} is a function you can defined in the computed`)
      }
    }
  },
  // 因数据变化都是在根元素 而渲染所用数据是$data 所以需要重新检查赋值
  $checkDate() {
    for (let key in this.$options.data) {
      this.$options.data[key] = this[key];
    }
  },
  $mountComputed() {
    let computed = this.$options.computed
    for (const key in computed) {
      let value = computed[key]
      if (typeof value === 'function') {
        if (!this[key] && this.$repaintCount === 0 || this.$repaintCount > 0) {
          this[key] = value.call(this)
          this.$data[key] = value.call(this)
        } else {
          throw new Error(`${key} is already defined in the data`)
        }
      } else {
        throw new Error(`${key} is a not function you can defined in the data`)
      }
    }
  },
  $mountMethods() {
    let methods = this.$options.methods
    for (const key in methods) {
      let func = methods[key];
      if (typeof func === 'function') {
        if (!this[key]) {
          this[key] = func.bind(this)
        } else {
          throw new Error(`${key} is already defined in the data or computed`)
        }
      } else {
        throw new Error(`${key} is a not function`)
      }
    }
  },
  $mountMixins() {
    let mixins = this.$options.mixins
    function add(mixin) {
      if (typeof mixin !== 'object') {
        throw new Error(mixins + ' this mixin is not a object!')
      }
      for (var key in mixin) {
        // TODO: 暂不支持 mixins in mixins
        if(key==='mixins'){
          throw new Error('mixins in mixins is not support！')
        }
        if (_.contains(['data', 'computed', 'methods', 'events'], key)) {
          $.extend(this.$options[key], mixin[key]);
        } else {
          // TODO: 暂不支持 根元素导出
          // this[key] = mixin[key].bind(this)
          throw new Error('mixins just support surround by data、computed、methods、events')
        }
      }
    }
    if (mixins instanceof Array) {
      _.each(mixins, function (mixin) {
        add.call(this,mixin);
      }.bind(this))
    } else {
      add.call(this,mixins);
    }
  },
  $extractEvents() {
    let template = this.$template
    const eventReg = /@([a-z]+)=['"](.*)['"]/gi
    let events = []
    template.replace(eventReg, (match, $1, $2, $3, $4) => {
      let elId = 'el' + nanoid(5)
      events.push({
        el: '#' + elId,
        eventname: $1,
        callbackname: $2.trim()
      })
      template = template.replace(match, `id="${elId}"`)
    })
    MVVM.prototype.events = events
    this.$template = template
  },
  $mountEvents() {
    let events = this.events
    let eventsHandle = this.$options.events
    const _this = this
    for (let index = 0; index < events.length; index++) {
      const event = events[index]
      let fn = eventsHandle[event.callbackname]
      if (fn) {
        this.$el.off(event.eventname, event.el).on(event.eventname, event.el, (function (fn) {
          return function (event) {
            fn.call(_this, event);
          }
        })(fn))
      } else {
        throw new Error(`event handler '${event.callbackname}' is not defined in the events`)
      }
    }
  },
  $lifeCircle() {
    this.$beforeCreate = this.$options.beforeCreate.bind(this)
    this.$beforeMount = this.$options.beforeMount.bind(this)
    this.$mounted = this.$options.mounted.bind(this)
    this.$updated = this.$options.updated.bind(this)
  },
  $render() {
    let compiled = _.template(this.$template)
    let newTempStr = compiled(this.$data)
    // 防止不必要的渲染
    if (newTempStr !== MVVM.prototype.$oldTempStr) {
      // 无diff
      /* this.$el.html(html)
      MVVM.prototype.$oldTempStr = html */
      // 基于DOMtree的diff
      if (!MVVM.prototype.$DOMtree) {
        //  第一次渲染
        let $DOMtree = html2elementTree(newTempStr)

        let $html = $DOMtree.render()
        MVVM.prototype.$DOMtree = $DOMtree
        MVVM.prototype.$html = $html
        this.$el.html($html);

        setTimeout(() => {
          this.$mounted();
        }, 0);
      } else {
        // 更新
        let $newDOMtree = html2elementTree(newTempStr)

        patch(MVVM.prototype.$html, diff(MVVM.prototype.$DOMtree, $newDOMtree))
        MVVM.prototype.$DOMtree = $newDOMtree

        setTimeout(() => {
          this.$updated();
        }, 0);
      }
      MVVM.prototype.$oldTempStr = newTempStr
    } else {
      console.warn('DOM has nothing to change!')
    }
  },
  $repaintCount: 0,
  $repaint() {
    this.$repaintCount++
      this.$checkDate()
    this.$mountData()
    this.$mountComputed()
    this.$render()
  }
})

module.exports = MVVM