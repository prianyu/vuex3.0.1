import applyMixin from './mixin'
import devtoolPlugin from './plugins/devtool'
import ModuleCollection from './module/module-collection'
import { forEachValue, isObject, isPromise, assert } from './util'

// 用户存放安装插件时的Vue构造函数，与Vuex关联
let Vue // bind on install

// Store 类
export class Store {
  constructor(options = {}) {
    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here. See #731
    // 自动安装Vuex，确保在使用script脚本引入vuex时的自动安装
    // Vue不存在即代表未安装，window.Vue存在即全局中引入了Vue
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    // 运行时断言
    if (process.env.NODE_ENV !== 'production') {
      // 未安装就使用则提示需要安装
      assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
      // 不支持Promise
      assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
      // 没有使用new操作符调用Store
      assert(this instanceof Store, `Store must be called with the new operator.`)
    }

    const {
      plugins = [], // 插件列表
      strict = false // 是否为严格模式
    } = options

    // 获取传入的state，如果为函数，则执行函数并返回结果
    // 否则直接返回state，为空时默认值是空对象
    let {
      state = {}
    } = options
    if (typeof state === 'function') {
      state = state() || {}
    }

    // store internal state
    // 各种内部状态标识
    this._committing = false // 是否正在提交，用于mutation标记
    this._actions = Object.create(null) // 存放action是对象
    this._actionSubscribers = [] // 存放action订阅者
    this._mutations = Object.create(null) // 存放mutations对象
    this._wrappedGetters = Object.create(null) // 存放getters，用于计算属性
    this._modules = new ModuleCollection(options) // 创建根模块树
    this._modulesNamespaceMap = Object.create(null) // 模块命名控件映射
    this._subscribers = [] // 订阅列表
    this._watcherVM = new Vue() // 一个vue实例，用于触发watcher

    // bind commit and dispatch to self
    // 定义dispatch和commit为绑定函数
    // 将其this属性绑定至当前的store实例
    const store = this
    const { dispatch, commit } = this
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store, type, payload)
    }
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    // strict mode
    // 标记当前实例是否为严格模式
    this.strict = strict

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    // 安装根模块
    // 1. 注册state、actions、mutations, getters
    // 2. 在_modulesNamespaceMap收集模块
    // 3. 递归安装子模块
    installModule(this, state, [], this._modules.root)

    // initialize the store vm, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreVM(this, state)

    // apply plugins
    // 安装插件
    plugins.forEach(plugin => plugin(this))

    // 安装devtools插件
    if (Vue.config.devtools) {
      devtoolPlugin(this)
    }
  }

  get state() {
    return this._vm._data.$$state
  }

  set state(v) {
    if (process.env.NODE_ENV !== 'production') {
      assert(false, `Use store.replaceState() to explicit replace store state.`)
    }
  }

  commit(_type, _payload, _options) {
    // check object-style commit
    const {
      type,
      payload,
      options
    } = unifyObjectStyle(_type, _payload, _options)

    const mutation = { type, payload }
    const entry = this._mutations[type]
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown mutation type: ${type}`)
      }
      return
    }
    this._withCommit(() => {
      entry.forEach(function commitIterator(handler) {
        handler(payload)
      })
    })
    this._subscribers.forEach(sub => sub(mutation, this.state))

    if (
      process.env.NODE_ENV !== 'production' &&
      options && options.silent
    ) {
      console.warn(
        `[vuex] mutation type: ${type}. Silent option has been removed. ` +
        'Use the filter functionality in the vue-devtools'
      )
    }
  }

  dispatch(_type, _payload) {
    // check object-style dispatch
    const {
      type,
      payload
    } = unifyObjectStyle(_type, _payload)

    const action = { type, payload }
    const entry = this._actions[type]
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown action type: ${type}`)
      }
      return
    }

    this._actionSubscribers.forEach(sub => sub(action, this.state))

    return entry.length > 1
      ? Promise.all(entry.map(handler => handler(payload)))
      : entry[0](payload)
  }

  subscribe(fn) {
    return genericSubscribe(fn, this._subscribers)
  }

  subscribeAction(fn) {
    return genericSubscribe(fn, this._actionSubscribers)
  }

  watch(getter, cb, options) {
    if (process.env.NODE_ENV !== 'production') {
      assert(typeof getter === 'function', `store.watch only accepts a function.`)
    }
    return this._watcherVM.$watch(() => getter(this.state, this.getters), cb, options)
  }

  replaceState(state) {
    this._withCommit(() => {
      this._vm._data.$$state = state
    })
  }

  registerModule(path, rawModule, options = {}) {
    if (typeof path === 'string') path = [path]

    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
      assert(path.length > 0, 'cannot register the root module by using registerModule.')
    }

    this._modules.register(path, rawModule)
    installModule(this, this.state, path, this._modules.get(path), options.preserveState)
    // reset store to update getters...
    resetStoreVM(this, this.state)
  }

  unregisterModule(path) {
    if (typeof path === 'string') path = [path]

    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    this._modules.unregister(path)
    this._withCommit(() => {
      const parentState = getNestedState(this.state, path.slice(0, -1))
      Vue.delete(parentState, path[path.length - 1])
    })
    resetStore(this)
  }

  hotUpdate(newOptions) {
    this._modules.update(newOptions)
    resetStore(this, true)
  }

  _withCommit(fn) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
  }
}

function genericSubscribe(fn, subs) {
  if (subs.indexOf(fn) < 0) {
    subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}

function resetStore(store, hot) {
  store._actions = Object.create(null)
  store._mutations = Object.create(null)
  store._wrappedGetters = Object.create(null)
  store._modulesNamespaceMap = Object.create(null)
  const state = store.state
  // init all modules
  installModule(store, state, [], store._modules.root, true)
  // reset vm
  resetStoreVM(store, state, hot)
}

function resetStoreVM(store, state, hot) {
  const oldVm = store._vm

  // bind store public getters
  store.getters = {}
  const wrappedGetters = store._wrappedGetters
  const computed = {}
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    computed[key] = () => fn(store)
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    })
  })

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const silent = Vue.config.silent
  Vue.config.silent = true
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })
  Vue.config.silent = silent

  // enable strict mode for new vm
  if (store.strict) {
    enableStrictMode(store)
  }

  if (oldVm) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(() => {
        oldVm._data.$$state = null
      })
    }
    Vue.nextTick(() => oldVm.$destroy())
  }
}

/**
 * 安装模块
 * 此函数负责在给定的store中安装一个模块，包括注册模块的命名空间、状态、mutation、action和getter。
 * 它支持嵌套模块的安装，并可以处理模块的热更新。
 * 
 * @param {Object} store Vuex的store实例。
 * @param {Object} rootState store的根状态对象。
 * @param {Array} path 当前在状态树中的路径，用于确定模块的命名空间。
 * @param {Object} module 要安装的模块对象，包含state、mutation、action、getter和modules（如果有子模块）。
 * @param {Boolean} hot 是否处于热更新模式
 */
function installModule(store, rootState, path, module, hot) {
  // 判断当前模块是否为根模块
  const isRoot = !path.length
  // 获取当前模块的命名空间
  const namespace = store._modules.getNamespace(path)

  // 带命名空间的模块在命名空间映射中登记模块
  // register in namespace map
  if (module.namespaced) {
    store._modulesNamespaceMap[namespace] = module
  }

  // set state
  // 设置state
  if (!isRoot && !hot) {  // 非根模块且非热更新时，设置模块状态
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      Vue.set(parentState, moduleName, module.state)
    })
  }

  // 创建模块的局部上下文对象，用于访问局部状态和命名空间
  // 模块可以有自己的命名空间，这意味着模块内的actions和mutations可以通过特定的前缀来区分
  // 从而避免与全局或其它模块的actions和mutations冲突
  const local = module.context = makeLocalContext(store, namespace, path)

  // 遍历module._rawModule.mutations,注册模块的mutation
  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key // 拼接命名空间
    registerMutation(store, namespacedType, mutation, local)
  })

  // 遍历module._rawModule.actions，注册模块的action
  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key // 转化key
    const handler = action.handler || action // 获取action的handler
    registerAction(store, type, handler, local)
  })

  // 遍历module._rawModule.getters，注册模块的getter
  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key
    registerGetter(store, namespacedType, getter, local)
  })

  // 遍历module._children，拼接命名空间，递归安装模块的子模块
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}

/**
 * make localized dispatch, commit, getters and state
 * if there is no namespace, just use root ones
 * @param {Object} store Vuex的store实例。
 * @param {String} namespace 模块的命名空间。
 * @param {Array} path 当前在状态树中的路径
 */
function makeLocalContext(store, namespace, path) {
  const noNamespace = namespace === '' // 没有命名空间

  // 局部的包含dispatch、commit、getters和state的对象
  const local = {
    // 如果没有命名空间则使用store的dispatch

    dispatch: noNamespace ? store.dispatch : (_type, _payload, _options) => {
      // 统一不同调用风格的参数
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) { // 不是根调用
        type = namespace + type // 给type拼上命名空间
        // 未注册对应的action则提示错误
        if (process.env.NODE_ENV !== 'production' && !store._actions[type]) {
          console.error(`[vuex] unknown local action type: ${args.type}, global type: ${type}`)
          return
        }
      }

      // 调用store的dispatch
      return store.dispatch(type, payload)
    },

    // 解析同dispatch
    commit: noNamespace ? store.commit : (_type, _payload, _options) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        if (process.env.NODE_ENV !== 'production' && !store._mutations[type]) {
          console.error(`[vuex] unknown local mutation type: ${args.type}, global type: ${type}`)
          return
        }
      }

      store.commit(type, payload, options)
    }
  }

  // getters and state object must be gotten lazily
  // because they will be changed by vm update
  // 给local添加getters和state延迟获取的方法
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters // 无命名空间返回store的getters
        : () => makeLocalGetters(store, namespace)
    },
    state: {
      // 根据路径获取嵌套的state
      get: () => getNestedState(store.state, path)
    }
  })

  return local
}

// 创建局部的getter代理对象
function makeLocalGetters(store, namespace) {
  const gettersProxy = {}

  const splitPos = namespace.length
  // 遍历全局的getters
  Object.keys(store.getters).forEach(type => {
    // skip if the target getter is not match this namespace
    // 检查当前getter是否匹配命名空间（以该命名空间开头）
    if (type.slice(0, splitPos) !== namespace) return

    // extract local getter type
    // 提取命名空间之后的内容，作为代理属性
    const localType = type.slice(splitPos)

    // Add a port to the getters proxy.
    // Define as getter property because
    // we do not want to evaluate the getters in this time.
    // 代理相关属性的值
    Object.defineProperty(gettersProxy, localType, {
      get: () => store.getters[type],
      enumerable: true
    })
  })

  return gettersProxy
}

/**
 * 注册mutation
 * @param {Store} store store实例
 * @param {string} type mutation的type，可以是key，也可以是命名空间+key
 * @param {Function} handler 处理函数
 * @param {Object} local 局部上下文
 */
function registerMutation(store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = []) // 初始化
  // 添加处理函数
  entry.push(function wrappedMutationHandler(payload) {
    // 以store作为this，当前state和外部传入的payload作为参数调用处理函数
    handler.call(store, local.state, payload)
  })
}

/**
 * 注册Actions
 * @param {Store} store Store实例
 * @param {string} type action的type，可以是key，也可以是命名空间+key
 * @param {Function} handler 处理函数
 * @param {Object} local 局部上下文
 */
function registerAction(store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = []) // 初始化
  entry.push(function wrappedActionHandler(payload, cb) {
    // 以store绑定this，定义的上下文以及payload、cb作为参数调用处理函数
    let res = handler.call(store, {
      // 注入局部上下文的dispatch,commit,getters和state
      dispatch: local.dispatch,
      commit: local.commit,
      getters: local.getters,
      state: local.state,
      // 注入根上下文的getters和state
      rootGetters: store.getters,
      rootState: store.state
    }, payload, cb)
    // 返回结果不是一个thenable对象，则转为一个立即resolve的promise对象
    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }
    if (store._devtoolHook) { // 触发devtools的hook
      return res.catch(err => {
        store._devtoolHook.emit('vuex:error', err)
        throw err
      })
    } else {
      return res
    }
  })
}

// 注册getters
function registerGetter(store, type, rawGetter, local) {
  if (store._wrappedGetters[type]) { // 已经注册过了
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] duplicate getter key: ${type}`)
    }
    return
  }
  // getter收集
  store._wrappedGetters[type] = function wrappedGetter(store) {
    // 传入局部上下文的state、getters，全局的state、getters依次传入作为参数调用getter函数
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    )
  }
}

function enableStrictMode(store) {
  store._vm.$watch(function () { return this._data.$$state }, () => {
    if (process.env.NODE_ENV !== 'production') {
      assert(store._committing, `Do not mutate vuex store state outside mutation handlers.`)
    }
  }, { deep: true, sync: true })
}

// 根据路径获取嵌套state
function getNestedState(state, path) {
  return path.length
    ? path.reduce((state, key) => state[key], state)
    : state
}

// 统一action和mutations的调用风格
function unifyObjectStyle(type, payload, options) {
  // type是一个包含type属性的对象
  if (isObject(type) && type.type) {
    options = payload // 第二个参数作为options
    payload = type // 第一个参数作为完整的payload
    type = type.type // type.type做为type
  }

  // type只能是string类型
  if (process.env.NODE_ENV !== 'production') {
    assert(typeof type === 'string', `Expects string as the type, but found ${typeof type}.`)
  }

  // 返回规范化后的参数对象
  return { type, payload, options }
}

// 安装Vuex到Vue中的方法
export function install(_Vue) {
  if (Vue && _Vue === Vue) { // 已安装
    // 如果不在生产环境中，输出错误信息到控制台
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[vuex] already installed. Vue.use(Vuex) should be called only once.'
      )
    }
    // 如果已经安装，则直接返回，避免重复安装
    return
  }
  // 将传入的_Vue实例赋值给全局的Vue变量，完成Vuex和Vue的关联
  Vue = _Vue
  // 应用混合（mixin）到Vue实例中，以集成Vuex的功能
  applyMixin(Vue)
}
