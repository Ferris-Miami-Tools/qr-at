<script setup>
  import { reactive, computed } from "vue";
  import { doc, deleteDoc, updateDoc, arrayRemove } from "firebase/firestore";
  import { db } from "../firebase";
  import store from "../store";

  import ConfirmDeletionModal from "./ConfirmDeletionModal.vue";

  const tableState = reactive({
    searchQuery: "",
    sortKey: "name",
    sortAsc: true,
    deletingStudent: false,
    deleteStudent: null,
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
        const aDate = new Date(a.lastAttended.replace(/-/g, "/"));
        const bDate = new Date(b.lastAttended.replace(/-/g, "/"));

        if (tableState.sortAsc) return aDate - bDate;
        else return bDate - aDate;
      } else if (tableState.sortKey == "total") {
        const diff = (a.present + a.excused) - (b.present + b.excused);
        return tableState.sortAsc ? diff : diff * -1;
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
  const deleteStudent = async () => {
    try {
      tableState.deletingStudent = true;

      await deleteDoc(doc(db, "attendance", tableState.deleteStudent.id));
      await updateDoc(doc(db, "users", tableState.deleteStudent.email), {
        sections: arrayRemove(tableState.deleteStudent.section),
      });
      store.state.students = store.state.students.filter(el => el.email != tableState.deleteStudent.email);
      store.actions.successToast(`Deleted ${tableState.deleteStudent.name} from the database.`);
    } catch (err) {
      console.log("ERROR | Deleting student.", err);
      store.actions.errorToast("Error deleting student. Please try again shortly.");
    } finally {
      tableState.deleteStudent = null;
      tableState.deletingStudent = false;
    }
  };
</script>

<template>
  <div class="h-fit col-span-12 md:col-span-9 mb-6">
    <confirm-deletion-modal
      v-if="tableState.deleteStudent"
      :deletingStudent="tableState.deletingStudent"
      :studentName="tableState.deleteStudent.name"
      :studentEmail="tableState.deleteStudent.email"
      @cancel="tableState.deleteStudent = null"
      @confirm-deletion="deleteStudent"
    />
    <!-- Table -->
    <div class="overflow-x-auto bg-white rounded-lg shadow overflow-y-auto relative">
      <table class="border-collapse table-auto w-full whitespace-no-wrap bg-white table-striped relative">
        <thead>
          <tr>
            <th class="bg-gray-100" colspan="7">
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
            <!-- Total -->
            <th @click="() => setSortKey('total')" class="select-none bg-gray-100 sticky top-0 border-b border-gray-200 px-6 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs cursor-pointer">
              <div class="flex items-center">
                <span>Total</span>
                <svg v-if="'total' == tableState.sortKey" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-1" :class="tableState.sortAsc ? 'rotate-180' : ''" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
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
            <th class="select-none bg-gray-100 sticky top-0 border-b border-gray-200 py-2 text-gray-600 font-bold tracking-wider uppercase text-xs text-center">
              <span>Actions</span>
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
            <!-- Total -->
            <td class="border-dashed border-t border-gray-200">
              <span class="text-gray-700 px-6 py-3 flex items-center">{{ student.present + student.excused }}</span>
            </td>
            <!-- Last Attended -->
            <td class="border-dashed border-t border-gray-200">
              <span class="text-gray-700 px-6 py-3 flex items-center">{{ student.lastAttended }}</span>
            </td>
            <!-- Actions -->
            <td class="border-dashed border-t border-gray-200">
              <div class="px-3 flex justify-around">
                <svg @click="() => store.mutations.setStudent(student)" class="w-6 h-6 text-green-800 hover:cursor-pointer hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                <svg @click="tableState.deleteStudent = student" class="w-6 h-6 text-red-800 hover:cursor-pointer hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
