<template>
  <div>
    {{  msg  }} {{  $store.state.count }}
  </div>
</template>
<script>
export default {
  data() {
    return {
      msg: "hello world"
    }
  }
}

</script>