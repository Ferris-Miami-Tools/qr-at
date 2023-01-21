<script setup>
  import { onMounted } from "vue";

  import store from "../store";

  onMounted(() => {
    if (store.state.classes) return;
    store.actions.fetchClasses();
  });
</script>

<template>
  <div class="flex justify-center">
    <div class="bg-white shadow-lg rounded-lg py-4 px-6 mb-4 w-full md:w-1/2">
      <h3 class="text-center">Class List</h3>
      <p v-if="store.state.loadingClasses">Loading...</p>
      <table
        v-else-if="store.state.classes.length > 0"
        class="w-full py-4 px-6 divide-y divide-gray-200 shadow-lg mb-6"
      >
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="aClass in store.state.classes" :key="`${aClass.section}-${aClass.day}`">
            <td class="px-6 py-4">{{ aClass.section }}</td>
            <td class="px-6 py-4">{{ aClass.day }}</td>
            <td class="px-6 py-4">{{ aClass.start }} to {{ aClass.end }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>You do not have any classes this semester.</p>
    </div>
  </div>
</template>
