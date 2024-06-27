import Module from './module'
import { assert, forEachValue } from '../util'

// vuex 模块集合，该类用于管理vuex的模块树
export default class ModuleCollection {
  // rawRootModule为实例化时传入的vuex配置对象
  constructor(rawRootModule) {
    // register root module (Vuex.Store options)
    // 注册根模块，并标记为静态注册
    this.register([], rawRootModule, false)
  }

  // 根据路径获取模块
  get(path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }

  // 根据路径获取命名空间
  getNamespace(path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }

  // 更新模块
  update(rawRootModule) {
    update([], this.root, rawRootModule)
  }

  /**
   * 注册一个模块到模块集合中。
   * @param {Array} path - 模块的路径
   * @param {Object} rawModule - 待注册的模块配置对象。
   * @param {boolean} runtime - 指示是否为运行时注册（即动态注册）。
   * Vuex支持模块的动态注册，动态注册使得Vuex模块更加灵活，一些第三方插件可以通过动态注册
   * 在store中附加新模块的方式来增强Vuex的状态管理（如`vuex-router-sync`插件）
   * 动态注册的模块可以也可以被卸载。然而，Vuex初始化时的模块不应该在运行时被删除，
   * 这是确保Vuex状态管理的可维护性和一致性考虑，因此Vuex在注册模块时，添加了runtime标记
   * 用于区分模块是静态注册还是动态注册
   * 1. 保证一致性，简化状态管理的管理过程，使代码更加清晰，易于维护
   * 2. 保证可读性和可预测性：使得状态树的结构在实例化时就被确定下来
   * 3. 易于跟踪状态的变化，使其更好的与Vue开发者工具集成
   */
  register(path, rawModule, runtime = true) {
    // 断言传入的vuex配置对象是否合法，对参数类型做校验
    if (process.env.NODE_ENV !== 'production') {
      assertRawModule(path, rawModule)
    }

    // 创建模块实例，Module实例是一个封装了对rawModule操作的实例，
    // 包括子模块的增删查改，以及模块actions,getter,mutations等操作
    const newModule = new Module(rawModule, runtime)
    if (path.length === 0) { // 路径为空则注册根模块
      this.root = newModule
    } else { // 否则注册子模块
      // 获取需要注册的子模块的父模块
      const parent = this.get(path.slice(0, -1))
      // 添加子模块
      parent.addChild(path[path.length - 1], newModule)
    }

    // register nested modules
    // 遍历子模块，递归注册子模块
    if (rawModule.modules) { // 模块中有modules属性则遍历
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }

  // 卸载一个模块
  unregister(path) {
    const parent = this.get(path.slice(0, -1)) // 获取父模块
    const key = path[path.length - 1] // 获取子模块的key
    if (!parent.getChild(key).runtime) return // 静态注册的不可卸载

    parent.removeChild(key) // 删除子模块
  }
}

// 更新模块，如热重载
function update(path, targetModule, newModule) {
  if (process.env.NODE_ENV !== 'production') {
    assertRawModule(path, newModule)
  }

  // update target module 更新模块
  targetModule.update(newModule)

  // update nested modules
  // 递归更新子模块
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

// 函数断言配置
const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}

// 对象断言配置
// 函数或者含有类型为函数的handler属性的对象
const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}

// 断言的类型配置
const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}

// 断言rawModule是否合法
function assertRawModule(path, rawModule) {
  // 遍历getters,mutations,actions
  Object.keys(assertTypes).forEach(key => {
    if (!rawModule[key]) return

    // 获取断言配置
    const assertOptions = assertTypes[key]

    // 遍历getters,mutations,actions
    forEachValue(rawModule[key], (value, type) => {
      // 执行断言，不通过时抛出错误
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}

// 根据传入的配置生成断言错误信息
function makeAssertionMessage(path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
