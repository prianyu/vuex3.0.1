<template>
  <div>
    {{  msg  }} {{  $store.state }}
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