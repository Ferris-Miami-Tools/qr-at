<script setup>
  import { ref, onMounted } from "vue";
  import { doc, getDoc, setDoc } from "firebase/firestore";
  import { db } from "../firebase";
  import store from "../store";
  import StudentTable from "./StudentTable.vue";
  const addingStudent = ref(false);
  const newName = ref("");
  const newEmail = ref("");
  const newSections = ref([]);
  const doesStudentExist = async email => {
    const docRef = doc(db, "users", email);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  };
  const addStudent = async () => {
    if (!newName.value) {
      store.actions.errorToast("Student name is a required field.");
      return;
    }
    if (!newEmail.value) {
      store.actions.errorToast("Student email is a required field.");
      return;
    }
    if (newSections.value.length == 0) {
      store.actions.errorToast("Student sections is a required field.");
      return;
    }
    try {
      addingStudent.value = true;
      // Check student is not already in firestore
      const studentExists = await doesStudentExist(newEmail.value);
      if (studentExists) {
        console.log("Student already exists");
        store.actions.errorToast("Student already exists. Contact Joshua Ferris for overrides.");
        return;
      }
      // Add student to firestore
      await setDoc(doc(db, "users", newEmail.value), {
        name: newName.value,
        instructor: false,
        sections: newSections.value,
      });
      store.state.students.push({ name: newName.value, email: newEmail.value, sections: newSections.value });
      store.actions.successToast(`Added ${newName.value} to the database.`);
      newName.value = "";
      newEmail.value = "";
      newSections.value = [];
    } catch (err) {
      console.log("ERROR | Adding student.", err);
      store.actions.errorToast("Error adding student. Please try again shortly.");
    } finally {
      addingStudent.value = false;
    }
  };
  onMounted(() => {
    if (store.state.students) return;
    store.actions.fetchStudents();
  });
</script>

<template>
  <div class="grid grid-cols-12 gap-4">
    <div class="h-fit col-span-12 md:col-span-3">
      <div class="bg-white shadow-lg rounded-lg py-4 px-6 mb-4">
        <button @click="() => store.actions.fetchStudents()" :disabled="store.state.loadingStudents" class="w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
          Refresh Students
        </button>
        <p class="mt-3 text-center text-xs text-gray-600">Updated: {{ store.state.lastUpdated }}</p>
      </div>
      <div class="bg-white shadow-lg rounded-lg py-4 px-6 mb-4">
        <details>
          <summary class="text-left">Add Student Form</summary>
          <label for="new-name" class="mt-2 block uppercase tracking-wide text-gray-700 text-xs font-bold">Student Name</label>
          <input v-model="newName" type="text" id="new-name" class="w-full bg-gray-200 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
          <label for="new-email" class="mt-2 block uppercase tracking-wide text-gray-700 text-xs font-bold">Student Email</label>
          <input v-model="newEmail" type="email" id="new-email" class="w-full bg-gray-200 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
          <label for="new-sections" class="mt-2 block uppercase tracking-wide text-gray-700 text-xs font-bold">Student Sections</label>
          <select v-model="newSections" multiple class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" id="new-sections">
            <option v-for="section in store.state.user.sections" :key="section" :value="section">{{ section }}</option>
          </select>
          <button @click="addStudent" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
            Add Student
          </button>
        </details>
      </div>
    </div>

    <!-- Student List -->
    <transition name="fade" mode="out-in">
      <student-table v-if="store.state.students && store.state.students.length > 0" />
      <div v-else-if="store.state.students && store.state.students.length == 0">No students</div>
      <div v-else-if="store.state.loadingStudents">Loading...</div>
      <div v-else>Error - please try again shortly. You may use the "Refresh Students" button.</div>
    </transition>
  </div>
</template>
