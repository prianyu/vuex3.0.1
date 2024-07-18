import Vue from "vue"
import Vuex from './vuex'

Vue.use(Vuex)

debugger
const store = new Vuex.Store({
  strict: true,

  state: {
    count: 0,
    firstName: "Foo",
    lastName: "Bar"
  },

  getters: {
    fullName(state) {
      return `${state.firstName} ${state.lastName}`
    }
  },

  mutations: {
    ADD(state) {
      state.count++
    },
    CHANGE_FIRST_NAME(state, payload) {
      state.firstName = payload
    }
  },

  actions: {
    changeFirstName({ commit }) {
      setTimeout(() => {
        commit("CHANGE_FIRST_NAME", 'Foo' + Math.random())
      }, 0)
    }
  },

  modules: {
    cart: {
      namespaced: true,
      state: {
        count: 0
      },

      getters: {
        info(state, getters, rootState, rootGetters) {
          return `${rootGetters}买了${state.count}件商品`
        }
      },

      mutations: {
        ADD(state) {
          state.count++
        }
      },

      actions: {
        add({ commit }) {
          commit("ADD")
        }
      }
    },

    goods: {
      state: {
        list: ['Banana', "Apple", "Orange"]
      },

      getters: {
        all(state) {
          return state.list.join("|")
        }
      },

      mutations: {
        ADD(state, payload) {
          state.list.push(payload)
        }
      },

      actions: {
        add({ commit }, payload) {
          commit("ADD", 'peach')
        }
      }
    }
  }
})

console.log(store)

// store.dispatch("add") // multi actions

export default store