<script setup>
  import { ref } from "vue";
  import store from "../store";
  import AppBar from "../components/AppBar.vue";
  import StudentDetails from "../components/StudentDetails.vue";
  import ClassList from "../components/ClassList.vue";
  import ClassSearch from "../components/ClassSearch.vue";
  import StudentManagement from "../components/StudentManagement.vue";
  import Export from "../components/Export.vue";

  const activeTab = ref(0);
  const tabs = [
    "Class Search",
    "Student Management",
    "Class List",
    "Export"
  ];
  const naviagteToTab = (tab) => {
    if (store.state.student) {
      store.mutations.setStudent(null);
    }

    activeTab.value = tab;
  };
</script>

<template>
  <app-bar />
  <main class="w-screen px-4">
    <ul class="flex justify-center items-center my-4">
      <li
        v-for="(tab, index) in tabs"
        :key="index"
        class="cursor-pointer py-2 px-4 text-gray-500 border-b-8 select-none duration-200"
        :class="activeTab===index ? 'text-purple-500 border-purple-500' : ''"
        @click="() => naviagteToTab(index)"
      >
        {{ tab }}
      </li>
    </ul>

    <student-details v-if="store.state.student" />
    <class-search v-else-if="activeTab===0" />
    <student-management v-else-if="activeTab===1" />
    <class-list v-else-if="activeTab===2" />
    <export v-else />
  </main>
</template>
