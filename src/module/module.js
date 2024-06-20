import { forEachValue } from '../util'

// 模块类
export default class Module {
  /**
   *
   * @param {Object} rawModule 需要实例化的模块配置对象
   * @param {Boolean} runtime   是否运行时
   */
  constructor(rawModule, runtime) {
    this.runtime = runtime
    this._children = Object.create(null) // 存放子模块
    this._rawModule = rawModule // 记录模块原始的配置对象
    const rawState = rawModule.state // 模块原始的state
    // 初始化state， state是函数时则执行函数并返回结果，否则直接返回state，默认值是{}
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }

  // 是否为带命名空间的模块
  get namespaced() {
    return !!this._rawModule.namespaced
  }

  // 添加子模块
  addChild(key, module) {
    this._children[key] = module
  }

  // 删除指定子模块
  removeChild(key) {
    delete this._children[key]
  }

  // 获取指定子模块
  getChild(key) {
    return this._children[key]
  }

  // 更新模块
  update(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced // 更新namespaced标记
    if (rawModule.actions) { // 更新actions
      this._rawModule.actions = rawModule.actions
    }
    if (rawModule.mutations) { // 更新mutations
      this._rawModule.mutations = rawModule.mutations
    }
    if (rawModule.getters) { // 更新getters
      this._rawModule.getters = rawModule.getters
    }
  }

  // 遍历子模块并执行指定的操作， fn会接收子模块及其子模块的key作为参数
  forEachChild(fn) {
    forEachValue(this._children, fn)
  }

  // 遍历getters并执行指定的操作， fn会接收getters及其key作为参数
  forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  // 遍历actions并执行指定的操作， fn会接收actions及其key作为参数
  forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  // 遍历mutations并执行指定的操作， fn会接收mutations及其key作为参数
  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}
