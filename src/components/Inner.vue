<template>
  <div class="inner"></div>
</template>
<script>
export default {
  beforeCreate() {
    console.log("Inner beforeCreate")
  },
  created() {
    console.log("Inner created")
  },
  beforeMount() {
    console.log("Inner beforeMount")
  },
  mounted() {
    console.log("Inner mounted")
  },
}
</script>