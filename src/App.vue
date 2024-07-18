<template>
  <div>
    <h1>{{ title }}</h1> 
    <div>
      {{ $store.state }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: "Vuex"
    }
  }
}
</script>