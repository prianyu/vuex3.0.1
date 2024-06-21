const devtoolHook =
  typeof window !== 'undefined' &&
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__ // 获取devtools的钩子

// 开发者工具插件
export default function devtoolPlugin(store) {
  if (!devtoolHook) return

  store._devtoolHook = devtoolHook // 给store添加_devtoolHook属性

  devtoolHook.emit('vuex:init', store) // 触发vuex:init事件

  // 监听vuex:travel-to-state事件
  devtoolHook.on('vuex:travel-to-state', targetState => {
    store.replaceState(targetState)
  })

  // 订阅mutation
  store.subscribe((mutation, state) => {
    devtoolHook.emit('vuex:mutation', mutation, state)
  })
}
