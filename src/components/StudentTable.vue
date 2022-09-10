<script setup>
  import { reactive, computed } from "vue";
  import store from "../store";

  const tableState = reactive({
    searchQuery: "",
    sortKey: "name",
    sortAsc: true,
  });

  const displayStudents = computed(() => {
    if (!store.state.students) return null;
    else return store.state.students.filter(student => {
      return (
        student.name.toLowerCase().indexOf(tableState.searchQuery.toLowerCase()) != -1
        || student.email.toLowerCase().indexOf(tableState.searchQuery.toLowerCase()) != -1
        || student.section.toLowerCase().indexOf(tableState.searchQuery.toLowerCase()) != -1
      );
    }).sort((a, b) => {
      if (tableState.sortKey == "name") {
        const aSplit = a.name.split(" ");
        const bSplit = b.name.split(" ");
        const aName = aSplit.reverse().join(" ");
        const bName = bSplit.reverse().join(" ");

        if (tableState.sortAsc) return aName.localeCompare(bName);
        else return -aName.localeCompare(bName);
      } else if (tableState.sortKey == "section") {
        if (tableState.sortAsc) return a.section.localeCompare(b.section);
        else return -a.section.localeCompare(b.section);
      } else if (tableState.sortKey == "lastAttended") {
        const aDate = new Date(a.lastAttended+"T12:00:00");
        const bDate = new Date(b.lastAttended+"T12:00:00");

        if (tableState.sortAsc) return aDate - bDate;
        else return bDate - aDate;
      } else {
        if (tableState.sortAsc) return a[tableState.sortKey] - b[tableState.sortKey];
        else return b[tableState.sortKey] - a[tableState.sortKey];
      }
    });
  });
  const setSortKey = key => {
    if (tableState.sortKey == key) {
      tableState.sortAsc = !tableState.sortAsc;
    } else {
      tableState.sortKey = key;
      tableState.sortAsc = true;
    }
  };
</script>

<template>
  <div class="h-fit col-span-12 md:col-span-9 mb-6">
    <!-- Table -->
    <div class="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
      <table class="border-collapse table-auto w-full whitespace-no-wrap bg-white table-striped relative">
        <thead>
          <tr>
            <th class="bg-gray-100" colspan="6">

              <div class="flex-1 pr-4">
                <div class="relative md:w-1/3">
                  <input v-model="tableState.searchQuery" type="search" placeholder="Search..." class="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:shadow-outline text-gray-600 font-medium border-none bg-gray-100 focus:ring-purple-700" >
                  <div class="absolute top-0 left-0 inline-flex items-center p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                      <circle cx="10" cy="10" r="7" />
                      <line x1="21" y1="21" x2="15" y2="15" />
                    </svg>
                  </div>
                </div>
              </div>
            </th>
          </tr>
					<tr class="text-left">
            <!-- Name and Email -->
            <th @click="() => setSortKey('name')" class="select-none bg-gray-100 sticky top-0 border-b border-gray-200 px-6 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs cursor-pointer">
              <div class="flex items-center">
                <span>Student</span>
                <svg v-if="'name' == tableState.sortKey" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" :class="tableState.sortAsc ? 'rotate-180' : ''" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </th>
            <!-- Section -->
            <th @click="() => setSortKey('section')" class="select-none bg-gray-100 sticky top-0 border-b border-gray-200 px-6 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs cursor-pointer">
              <div class="flex items-center">
                <span>Section</span>
                <svg v-if="'section' == tableState.sortKey" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" :class="tableState.sortAsc ? 'rotate-180' : ''" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </th>
            <!-- Excused -->
            <th @click="() => setSortKey('excused')" class="select-none bg-gray-100 sticky top-0 border-b border-gray-200 px-6 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs cursor-pointer">
              <div class="flex items-center">
                <span>Excused</span>
                <svg v-if="'excused' == tableState.sortKey" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" :class="tableState.sortAsc ? 'rotate-180' : ''" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </th>
            <!-- Present -->
            <th @click="() => setSortKey('present')" class="select-none bg-gray-100 sticky top-0 border-b border-gray-200 px-6 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs cursor-pointer">
              <div class="flex items-center">
                <span>Present</span>
                <svg v-if="'present' == tableState.sortKey" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" :class="tableState.sortAsc ? 'rotate-180' : ''" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </th>
            <!-- Last Seen -->
            <th @click="() => setSortKey('lastAttended')" class="select-none bg-gray-100 sticky top-0 border-b border-gray-200 px-6 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs cursor-pointer">
              <div class="flex items-center">
                <span>Last Attended</span>
                <svg v-if="'lastAttended' == tableState.sortKey" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" :class="tableState.sortAsc ? 'rotate-180' : ''" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="0" y="0" width="24" height="24" stroke="none"></rect>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </th>
            <!-- Actions -->
            <th class="bg-gray-100 sticky top-0 border-b border-gray-200 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs">
              <div class="flex items-center text-left">
                <span>Actions</span>
              </div>
            </th>
					</tr>
				</thead>
        <tbody>
          <tr v-for="student in displayStudents" :key="student.id">
            <!-- Name and Email -->
            <td class="border-dashed border-t border-gray-200">
              <span class="text-gray-700 px-6 pt-3 flex items-center">{{ student.name }}</span>
              <span class="text-gray-600 text-xs px-6 pt-1 pb-3 flex items-center">{{ student.email }}</span>
            </td>
            <!-- Section -->
            <td class="border-dashed border-t border-gray-200">
              <span class="text-gray-700 px-6 py-3 flex items-center">{{ student.section }}</span>
            </td>
            <!-- Excused -->
            <td class="border-dashed border-t border-gray-200">
              <span class="text-gray-700 px-6 py-3 flex items-center">{{ student.excused }}</span>
            </td>
            <!-- Present -->
            <td class="border-dashed border-t border-gray-200">
              <span class="text-gray-700 px-6 py-3 flex items-center">{{ student.present }}</span>
            </td>
            <!-- Last Attended -->
            <td class="border-dashed border-t border-gray-200">
              <span class="text-gray-700 px-6 py-3 flex items-center">{{ student.lastAttended }}</span>
            </td>
            <!-- Actions -->
            <td class="border-dashed border-t border-gray-200">
              <div v-if="store.state.student && student.email == store.state.student.email" class="py-1 text-green-500 border border-transparent">Selected</div>
              <button v-else @click="() => store.mutations.setStudent(student)" class="bg-transparent hover:bg-green-500 text-green-700 hover:text-slate-50 py-1 px-2 border border-green-500 hover:border-transparent rounded">
                Select Student
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
