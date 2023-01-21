<script setup>
  import { ref, onMounted } from "vue";
  import { query, collection, where, getDocs } from "firebase/firestore";
  import { db } from "../firebase";
  import store from '../store';

  const loading = ref(false);

  const fetchAttendance = async () => {
    try {
      loading.value = true;
      store.mutations.setStudentAttendance(null);

      let attendance = [];
      const q = query(
        collection(db, "checkins"),
        where("email", "==", store.state.student.email),
        where("section", "==", store.state.student.section)
      );
      const qsnap = await getDocs(q);
      qsnap.forEach(doc => {
        const { date, excused, present } = doc.data();
        attendance.push({
          date: new Date(date+"T12:00:00"),
          status: present ? "Present" : excused ? "Excused" : present && excused ? "Present and excused" : "Absent",
        });
      });
      attendance.sort((a, b) => b.date - a.date);

      store.mutations.setStudentAttendance({
        email: store.state.student.email,
        section: store.state.student.section,
        attendance,
      });
      store.actions.infoToast("Successfully updated student attendance data");
    } catch (err) {
      console.log("ERROR | Fetching student attendance.", err);
      store.actions.errorToast("Error fetching student attendance. Please try again shortly.");
    } finally {
      loading.value = false;
    }
  };

  const refreshData = async () => {
    await store.actions.fetchStudents();
    await fetchAttendance();
  };

  onMounted(() => {
    if (
      store.state.studentAttendance
      && store.state.studentAttendance.email == store.state.student.email
      && store.state.studentAttendance.section == store.state.student.section
    ) return;
    fetchAttendance();
  });
</script>

<template>
  <div class="grid grid-cols-12 gap-4">
    <!-- Sidebar -->
    <div class="h-fit col-span-12 md:col-span-4">
      <div class="bg-white shadow-lg rounded-lg py-4 px-6 mb-4">
        <section>
          <h3 class="text-lg text-center">{{ store.state.student.name }}</h3>
          <p class="text-xs text-center text-gray-600">{{ store.state.student.email }}</p>
          <p class="text-xs text-center text-gray-600">{{ store.state.student.section }}</p>
        </section>
        <section class="mt-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-md bg-gray-50 border border-gray-300 flex items-center">
              <div class="py-1 px-3 text-gray-900 bg-gray-200">Present</div>
              <div class="py-1 px-3">{{ store.state.student.present }}</div>
            </div>
            <div class="rounded-md bg-gray-50 border border-gray-300 flex items-center">
              <div class="py-1 px-3 text-gray-900 bg-gray-200">Excused</div>
              <div class="py-1 px-3">{{ store.state.student.excused }}</div>
            </div>
          </div>

          <div class="mt-4 rounded-md bg-gray-50 border border-gray-300 flex items-center">
            <div class="py-1 px-3 w-1/2 text-gray-900 bg-gray-200">Last Attended</div>
            <div class="py-1 px-3 w-1/2 text-right">{{ store.state.student.lastAttended }}</div>
          </div>
        </section>
        <section class="mt-6 grid grid-cols-2 gap-4">
          <button @click="store.mutations.setStudent(null)" class="w-full bg-transparent hover:bg-stone-400 text-stone-700 font-semibold hover:text-white py-3 px-4 border border-stone-400 hover:border-transparent rounded flex justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
          </button>
          <button @click="refreshData" :disabled="loading || store.state.loadingStudents" class="w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded flex justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </section>
        <!-- <section class="mt-6">
          <button @click="refreshData" :disabled="loading || store.state.loadingStudents" class="w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
            Refresh Student Attendance
          </button>
          <button @click="store.mutations.setStudent(null)" class="mt-3 w-full bg-transparent hover:bg-stone-400 text-stone-700 font-semibold hover:text-white py-3 px-4 border border-stone-400 hover:border-transparent rounded">
            Return to Roster
          </button>
        </section> -->
        <section class="mt-6">
          <p class="text-center text-xs text-gray-600">Updated: {{ store.state.lastUpdated }}</p>
        </section>
      </div>
    </div>
    <!-- Attendance Record -->
    <div class="h-fit col-span-12 md:col-span-8">
      <div class="bg-white shadow-lg rounded-lg">
        <transition name="fade" mode="out-in">
          <table
            v-if="store.state.studentAttendance && store.state.studentAttendance.attendance.length > 0"
            class="w-full py-4 px-6 divide-y divide-gray-200 shadow-lg mb-6"
          >
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="att in store.state.studentAttendance.attendance" :key="att.date">
                <td class="px-6 py-4">{{ `${String((att.date.getMonth() + 1)).padStart(2, "0")}-${String(att.date.getDate()).padStart(2, "0")}-${att.date.getFullYear()}` }}</td>
                <td class="px-6 py-4">{{ att.status }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else-if="store.state.studentAttendance && store.state.studentAttendance.attendance.length == 0" class="py-4 px-6">{{ store.state.student.name }} has not attended any classes.</div>
          <div v-else-if="loading" class="py-4 px-6">Loading...</div>
          <div v-else class="py-4 px-6">Error - please try again shortly.</div>
        </transition>
      </div>
    </div>
  </div>
</template>
