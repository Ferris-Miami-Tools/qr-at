<script setup>
  import store from "./store";
  import Instructor from "./views/Instructor.vue";
  import Loading from "./views/Loading.vue";
  import Login from "./views/Login.vue";
  import Student from "./views/Student.vue";
</script>

<template>
  <loading v-if="typeof(store.state.user) == 'undefined'" />
  <login v-else-if="store.state.user == null" />
  <instructor v-else-if="store.state.user.instructor" />
  <student v-else />
</template>
