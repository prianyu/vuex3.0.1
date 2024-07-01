// mapState是一个接收(namespace, states)为参数的函数
// 该函数由normalizeNamespace返回，具有规范化namespace和states的能力
export const mapState = normalizeNamespace((namespace, states) => {
  const res = {}
  // 将states转为[{key, val}]后遍历
  normalizeMap(states).forEach(({ key, val }) => {
    // res[key]是一个函数，因此可以在Vue实例中使用computed的属性访问
    res[key] = function mappedState() {
      let state = this.$store.state // 从当前Vue实例获取$store.state
      let getters = this.$store.getters // 从当前Vue实例获取$store.getters
      if (namespace) {// 带了命名空间
        // 从store._modulesNamespaceMap中获取命名空间对应的模块
        const module = getModuleByNamespace(this.$store, 'mapState', namespace)
        if (!module) {
          return
        }
        // 从模块中的局部上下文中获取state和getters
        // context是new Store时，执行installModule时生成的context
        state = module.context.state
        getters = module.context.getters
      }
      // val是个function，则以当前Vue实例绑定this后，传入state和getters作为参数执行返回结果
      // 否则返回state[val]
      return typeof val === 'function'
        ? val.call(this, state, getters)
        : state[val]
    }
    // mark vuex getter for devtools
    // 将当前函数标记为来自vuex，提供给devtools
    res[key].vuex = true
  })
  return res
})

// mapState是一个接收(namespace, mutations)为参数的函数
// 该函数由normalizeNamespace返回，具有规范化namespace和mutations的能力
export const mapMutations = normalizeNamespace((namespace, mutations) => {
  const res = {}
  normalizeMap(mutations).forEach(({ key, val }) => {
    res[key] = function mappedMutation(...args) {
      let commit = this.$store.commit
      if (namespace) {
        // 从store._modulesNamespaceMap中获取命名空间对应的模块
        const module = getModuleByNamespace(this.$store, 'mapMutations', namespace)
        if (!module) {
          return
        }
        // 从模块中的局部上下文中获取commit方法
        commit = module.context.commit
      }

      return typeof val === 'function' // 第二个参数是函数形式：function(commit, ...args) { commit('xxx', ...args) })
        ? val.apply(this, [commit].concat(args)) // 映射为vm.val(commit, ...args)
        : commit.apply(this.$store, [val].concat(args)) // 映射为this.$store.commit(val, ...args)
    }
  })
  return res
})
// mapState是一个接收(namespace, getters)为参数的函数
// 该函数由normalizeNamespace返回，具有规范化namespace和getters的能力
export const mapGetters = normalizeNamespace((namespace, getters) => {
  const res = {}
  normalizeMap(getters).forEach(({ key, val }) => {
    val = namespace + val
    res[key] = function mappedGetter() {
      // 不存在的模块
      if (namespace && !getModuleByNamespace(this.$store, 'mapGetters', namespace)) {
        return
      }
      // 不存在的getter
      if (process.env.NODE_ENV !== 'production' && !(val in this.$store.getters)) {
        console.error(`[vuex] unknown getter: ${val}`)
        return
      }
      // 从$store.getters中获取
      return this.$store.getters[val]
    }
    // mark vuex getter for devtools
    // 给devtools的vuex标记
    res[key].vuex = true
  })
  return res
})

// mapState是一个接收(namespace, actions)为参数的函数
// 该函数由normalizeNamespace返回，具有规范化namespace和states的能力
export const mapActions = normalizeNamespace((namespace, actions) => {
  const res = {}
  normalizeMap(actions).forEach(({ key, val }) => {
    res[key] = function mappedAction(...args) {
      let dispatch = this.$store.dispatch
      if (namespace) {
        // 获取模块
        const module = getModuleByNamespace(this.$store, 'mapActions', namespace)
        if (!module) { // 不存在的模块
          return
        }
        // 局部上下文中的dispatch
        dispatch = module.context.dispatch
      }
      return typeof val === 'function'// 第二个参数是函数形式：function(dispatch, ...args) { dispatch('xxx', ...args) }
        ? val.apply(this, [dispatch].concat(args)) // 映射为vm.val(dispatch, ...args)
        : dispatch.apply(this.$store, [val].concat(args)) // 映射为this.$store.dispatch(val, ...args)
    }
  })
  return res
})

// 创建基于命名空间的组件绑定函数，其返回一个包含了mapState, mapGetters, mapMutations, mapActions函数的对象
// 返回的函数已经绑定了指定的命名空间
export const createNamespacedHelpers = (namespace) => ({
  mapState: mapState.bind(null, namespace),
  mapGetters: mapGetters.bind(null, namespace),
  mapMutations: mapMutations.bind(null, namespace),
  mapActions: mapActions.bind(null, namespace)
})

// 将map转为{key, val}数组
// [a, b] => [{key: a, val: a}, {key: b, val: b}]
// {a: c, b: d} => [{key: a, val: c}, {key: b, val: d}]
function normalizeMap(map) {
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] })) // 此处如果是非Object会返回空数组
}

// 接收一个回调函数并返回一个接收namespace和map，可以规范化参数的新函数
function normalizeNamespace(fn) {
  return (namespace, map) => {
    // 参数规范化
    if (typeof namespace !== 'string') {
      // namespace不是字符串则将namespace赋值给map后置空
      map = namespace
      namespace = ''
    } else if (namespace.charAt(namespace.length - 1) !== '/') {
      // namespace以/结尾
      namespace += '/'
    }
    return fn(namespace, map)
  }
}
// 根据namespace获取module
// 获取不到则抛出根据传入的辅助函数名称拼接的错误信息
function getModuleByNamespace(store, helper, namespace) {
  const module = store._modulesNamespaceMap[namespace]
  if (process.env.NODE_ENV !== 'production' && !module) {
    console.error(`[vuex] module namespace not found in ${helper}(): ${namespace}`)
  }
  return module
}
