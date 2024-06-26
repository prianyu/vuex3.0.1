<template>
  <div class="outer">
    <Inner />
  </div>
</template>
<script>
import Inner from './Inner.vue'
export default {
  components: {
    Inner,
  },
  beforeCreate() {
    console.log("Outer beforeCreate")
  },
  created() {
    console.log("Outer created")
  },
  beforeMount() {
    console.log("Outer beforeMount")
  },
  mounted() {
    console.log("Outer mounted")
  },
}
</script>