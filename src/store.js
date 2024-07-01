import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex)

// module map
// const store = new Vuex.Store({
//   namespaced: true,
//   state: {
//     count: 0
//   },
//   mutations: {
//     increment(state) {
//       state.count++
//     }
//   },
//   modules: {
//     cart: {
//       namespaced: true,
//       list: [],
//       mutations: {
//         add(state, payload) {
//           state.list.push(payload)
//         }
//       }
//     },
//     goods: {
//       name: "apple",
//       mutations: {
//         reduce(state, payload) {
//           state.name = payload
//         }
//       }
//     }
//   }
// })
// nested module state
// const store = new Vuex.Store({
//   state: {
//     count: 0
//   },
//   modules: {
//     a: {
//       state: {
//         name: "Foo"
//       }
//     },
//     b: {
//       state: {
//         name: "Bar",
//       },
//       modules: {
//         c: {
//           state: {
//             name: "Baz"
//           }
//         }
//       }
//     }
//   }
// })

// getters proxy
// const store = new Vuex.Store({
//   state: {
//     a: 1,
//     b: 2
//   },
//   getters: {
//     total: state => state.a + state.b
//   },
//   modules: {
//     user: {
//       namespaced: true,
//       state: {
//         lastName: 'Foo',
//         firstName: 'Bar'
//       },
//       getters: {
//         fullName: state => state.lastName + ' ' + state.firstName
//       }
//     }
//   }
// })

// console.log(store)

// multi mutations
// const store = new Vuex.Store({
//   state: {
//     count: 0,
//   },
//   mutations: {
//     increment(state) {
//       state.count++
//     }
//   },
//   modules: {
//     inner: {
//       state: {
//         num: 0
//       },
//       mutations: {
//         increment(state) {
//           state.num++
//         }
//       }
//     }
//   }
// })

// store.commit('increment')
// console.log(store.state)



const store = new Vuex.Store({
  strict: true,
  state: {
    firstName: 'Foo',
    lastName: 'Bar',
  },
  getters: {
    fullName(state) {
      return state.firstName + ' ' + state.lastName
    }
  },
  mutations: {
    increment(state, payload) {
      // 违反规范使用异步
      setTimeout(() => {
        state.firstName = payload.firstName
      }, 1000)
    }
  },
  actions: {
    AsyncIncrement(context) { }
  },
  modules: {
    inner1: {
      namespaced: true, // 开启命名空间
      state: {
        name: "inner1"
      },
      getters: {
        something(state, getters, rootState, rootGetters) {
          return state.hours * state.price
        }
      },
      mutations: {
        increment(state) { }
      },
      actions: {
        AsyncIncrement(context) {
          context.commit('increment')
        }
      },
    },
    inner2: {
      // 未开启命名空间
      state: {
        name: "inner2"
      },
      getters: {
        something(state, getters, rootState, rootGetters) {
          return state.hours * state.price
        }
      },
      mutations: {
        increment(state) { }
      },
      actions: {
        AsyncIncrement(context) {
          context.commit('increment')
        }
      },
    }
  }
})

console.log(store)

// store.commit('increment', { firstName: 'asdgasdgasgsg' })
store.state.firstName = "28888" // 违反规范直接修改



export default store