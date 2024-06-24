export default function (Vue) {
  const version = Number(Vue.version.split('.')[0]) // 获取当前Vue的版本号

  // vue2.0以上则混入beforeCreate钩子函数
  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit })
  } else { // vue1.x
    // override init and inject vuex init procedure
    // for 1.x backwards compatibility.
    // 重写Vue.prototype._init方法
    const _init = Vue.prototype._init
    Vue.prototype._init = function (options = {}) {
      options.init = options.init
        ? [vuexInit].concat(options.init)
        : vuexInit
      _init.call(this, options)
    }
  }

  /**
   * Vuex init hook, injected into each instances init hooks list.
   * 在每一个Vue实例上注入$store属性：
   * 1. 先获取当前实例的store属性配置， store = this.$options.store
   * 2. 如果存在:
   *    2.1 如果store是一个函数，则将store()的执行返回值赋值给this.$store
   *    2.2 否则，将this.$store = store
   * 3. 如果不存在，则从父级实例中获取$store属性，如果存在，则赋值给this.$store，这确保所有的子组件都能够读取到store实例
   */

  function vuexInit() {
    // 获取当前实例的$options
    const options = this.$options
    // store injection
    if (options.store) { // 如果有store属性，则注入
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store
    } else if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store
    }
  }
}
