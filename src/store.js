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
const store = new Vuex.Store({
  state: {
    a: 1,
    b: 2
  },
  getters: {
    total: state => state.a + state.b
  },
  modules: {
    user: {
      namespaced: true,
      state: {
        lastName: 'Foo',
        firstName: 'Bar'
      },
      getters: {
        fullName: state => state.lastName + ' ' + state.firstName
      }
    }
  }
})

console.log(store)



export default store