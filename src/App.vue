<template>
  <div>
    {{  msg  }} {{  $store.state }} {{ $store.getters  }}
    <a href="">{{ $store.state.count }}</a>
    <a href="">{{ $store.getters.count }}</a>
    <Outer />
  </div>
</template>
<script>
import Outer from "./components/Outer.vue"
export default {
  components: {
    Outer
  },
  data() {
    return {
      msg: "hello world"
    }
  },

  beforeCreate() {
    console.log("App beforeCreate")
  },
  created() {
    console.log("App created")
  },
  beforeMount() {
    console.log("App beforeMount")
  },
  mounted() {
    console.log("App mounted")
  },

}

</script>