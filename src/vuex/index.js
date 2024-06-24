/**
 * 导入Store类和install函数，它们用于创建和安装 Vuex store。
 * @type {Object}
 */
import { Store, install } from './store'

/**
 * 导入一系列辅助函数，用于在组件中映射状态、mutations、getters和actions，以及创建命名空间辅助函数。
 * @type {Object}
 */
import { mapState, mapMutations, mapGetters, mapActions, createNamespacedHelpers } from './helpers'

/**
 * 导出 Vuex 插件的主要对象。
 * 这个对象包含了 Vuex 的核心功能和版本信息，以及一系列辅助函数，用于在 Vue 组件中便捷地使用 Vuex。
 * @property {Function} Store - Vuex store 的构造函数。
 * @property {Function} install - Vuex 插件的安装函数。
 * @property {String} version - Vuex 的版本信息。
 * @property {Function} mapState - 映射 Vuex store 的状态到组件的计算属性。
 * @property {Function} mapMutations - 映射 Vuex store 的 mutations 到组件的方法。
 * @property {Function} mapGetters - 映射 Vuex store 的 getters 到组件的计算属性。
 * @property {Function} mapActions - 映射 Vuex store 的 actions 到组件的方法。
 * @property {Function} createNamespacedHelpers - 创建带有命名空间的辅助函数，用于处理命名空间内的 state、mutations、getters 和 actions。
 */
export default {
  Store,
  install,
  version: '__VERSION__',
  mapState,
  mapMutations,
  mapGetters,
  mapActions,
  createNamespacedHelpers
}
