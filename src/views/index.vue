<template>
  <div class="contain">
    <router-view/>
  </div>
</template>

<script>
import * as loginApi from "@/api/login"
export default {
  name: 'HomeView',
  methods: {
    getInfo(){
      loginApi.getInfo()
    }
  },
  mounted() {
    this.getInfo()
  }
}
</script>

<style scoped>
.contain{
  width: 100%;
  height: 100%;
}
</style>
