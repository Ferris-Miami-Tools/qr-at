<script setup>
  import { ref, onBeforeUnmount, computed, reactive } from "vue";
  import { query, collection, where, getDocs, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
  import { db } from "../firebase";
  import store from "../store";
  import Toggle from "./Toggle.vue";

  const updateDateState = () => {
    console.log("Date state interval fired");
    dateState.current = new Date();
    
    // If no class early return
    if (dateState.class.startHour == null || dateState.class.startMinute == null || dateState.class.endHour == null || dateState.class.endMinute == null) return;

    // Update start and end date objects
    dateState.class.start = new Date(`${searchDate.value}T${leadingZero(dateState.class.startHour)}:${leadingZero(dateState.class.startMinute)}:00`);
    dateState.class.end = new Date(`${searchDate.value}T${leadingZero(dateState.class.endHour)}:${leadingZero(dateState.class.endMinute)}:00`);

    if (dateState.current >= dateState.class.start && dateState.current <= dateState.class.end) {
      // Class in progress
      console.log("Class in progress");
      const curTSM = (dateState.current.getHours() * 60) + dateState.current.getMinutes();
      dateState.classProgress = ((curTSM - dateState.class.startTSM)/(dateState.class.endTSM - dateState.class.startTSM)) * 100;
    } else if (dateState.current < dateState.class.start) {
      // Class has not started yet
      console.log("Class has not started yet");
      dateState.classProgress = 0;
    } else {
      // Class is in the past
      console.log("Class is in the past");
      dateState.classProgress = 100;
      clearInterval(dateState.interval);
    }
  };

  const searchDate = ref(null);
  const dateState = reactive({
    current: new Date(),
    class: {
      start: null,
      startTSM: null,
      startHour: null,
      startMinute: null,
      startString: null,
      end: null,
      endTSM: null,
      endHour: null,
      endMinute: null,
      endString: null,
    },
    interval: setInterval(updateDateState, 1000 * 10), // 10 second interval
    classProgress: 0,
  });
  const leadingZero = (num) => {
    return String(num).padStart(2, '0');
  };

  onBeforeUnmount(() => {
    clearSearch()
    clearInterval(dateState.interval);
  });
  const searching = ref(false);
  
  const searchSections = ref([]);
  const searchSub = ref(null);
  const students = ref(null);
  const presentCount = computed(() => {
    if (!students.value) return 0;
    const onlyPresent = students.value.filter(el => el.present);
    return onlyPresent.length;
  });
  const excusedCount = computed(() => {
    if (!students.value) return 0;
    const onlyExcused = students.value.filter(el => el.excused);
    return onlyExcused.length;
  });
  
  const allSectionHaveClass = async (sections, date) => {
    let allGood = true;
    for (const section of sections) {
      const d = new Date(date+"T12:00:00");
      const q = query(
        collection(db, "classes"),
        where("day", "==", d.getDay()),
        where("section", "==", section)
      );
      const qsnap = await getDocs(q);
      if (qsnap.empty) {
        store.actions.errorToast(`${section} did not have class on ${date}.`);
        allGood = false;
      } else {
        const classData = qsnap.docs[0].data();
        
        // Set date state
        dateState.class.startTSM = classData.start + 15;
        dateState.class.endTSM = classData.end - 15;
        dateState.class.startHour = Math.floor(dateState.class.startTSM / 60);
        dateState.class.startMinute = dateState.class.startTSM - (dateState.class.startHour * 60);
        dateState.class.startString = `${dateState.class.startHour % 12}:${leadingZero(dateState.class.startMinute)}${dateState.class.startHour >= 12 ? 'PM' : 'AM'}`;
        dateState.class.endHour = Math.floor(dateState.class.endTSM / 60);
        dateState.class.endMinute = dateState.class.endTSM - (dateState.class.endHour * 60);
        dateState.class.endString = `${dateState.class.endHour % 12}:${leadingZero(dateState.class.endMinute)}${dateState.class.endHour >= 12 ? 'PM' : 'AM'}`;

        // Force immediate update of date state
        updateDateState();
      }
    }
    return allGood;
  };
  
  const studentsInSections = async sections => {
    let studs = [];
    const q = query(
      collection(db, "users"),
      where("sections", "array-contains-any", sections)
    );
    const qsnap = await getDocs(q);
    qsnap.forEach(doc => {
      const { name, instructor, sections: studSections } = doc.data();
      if (instructor) return;
      studs.push({ name, email: doc.id, section: sections.filter(value=>studSections.includes(value))[0] });
    });
    return studs;
  };
  const clearSearch = () => {
    if (searchSub.value) searchSub.value();
    searchSub.value = null;
    students.value = null;

    // Reset date state
    dateState.class.startTSM = null;
    dateState.class.endTSM = null;
    dateState.class.startHour = null;
    dateState.class.startMinute = null;
    dateState.class.startString = null;
    dateState.class.endHour = null;
    dateState.class.endMinute = null;
    dateState.class.endString = null;
  };
  const searchClasses = async () => {
    console.log("Search Classes");
    // Validate search fields
    if (!searchDate.value) {
      store.actions.errorToast("The date field is required.");
      return;
    } else if (!searchSections.value || searchSections.value.length < 1) {
      store.actions.errorToast("The sections field is required.");
      return;
    }
    try {
      console.log(`Searching for ${searchSections.value}'s class on ${searchDate.value}`);
      searching.value = true;
      // Ensure all section had class on requested date
      const hasClass = await allSectionHaveClass(searchSections.value, searchDate.value);
      if (!hasClass) return;
      // Get students in requested section
      const sectionStudents = await studentsInSections(searchSections.value);
      // Create listener for student checkins
      const q = query(
        collection(db, "checkins"),
        where("section", "in", searchSections.value),
        where("date", "==", searchDate.value)
      );
      searchSub.value = onSnapshot(q, qs => {
        const attendance = {};
        qs.forEach(doc => {
          const data = doc.data();
          attendance[data.email] = {
            id: doc.id,
            present: data.present || false,
            excused: data.excused || false,
          };
        });
        students.value = sectionStudents.map(student => {
          const student_attendance = attendance[student.email] || null;
          if (student_attendance) {
            return { ...student, ...student_attendance };
          } else {
            return { ...student, present: false, excused: false };
          }
        });
      });
    } catch (err) {
      console.error("ERROR | Class search", err);
      store.actions.errorToast("Error. Please try again shortly.");
      clearSearch();
    } finally {
      searching.value = false;
    }
  };
  const markExcused = async student => {
    console.log(`Mark excused: ${student.email}`);
    try {
      if (student.id) {
        await updateDoc(
          doc(db, "checkins", student.id),
          { excused: !student.excused }
        );
      } else {
        await addDoc(
          collection(db, "checkins"),
          {
            date: searchDate.value,
            email: student.email,
            section: student.section,
            present: student.present,
            excused: !student.excused,
            timestamp: serverTimestamp()
          }
        );
      }
    } catch (err) {
      console.log("ERROR | Marking student as excused.", err);
      store.actions.errorToast("Error excusing student. Please try again shortly.");
    }
  };
  const markPresent = async student => {
    console.log(`Mark Present: ${student.email}`);
    try {
      if (student.id) {
        await updateDoc(
          doc(db, "checkins", student.id),
          { present: !student.present }
        );
      } else {
        await addDoc(
          collection(db, "checkins"),
          {
            date: searchDate.value,
            email: student.email,
            section: student.section,
            present: !student.present,
            excused: student.excused,
            timestamp: serverTimestamp(),
          }
        );
      }
    } catch (err) {
      console.log("ERROR | Marking student as present.", err);
      store.actions.errorToast("Error marking student as present. Please try again shortly.");
    }
  };
</script>

<template>
  <div class="grid grid-cols-12 gap-4">
    <!-- Search Panel -->
    <div class="h-fit col-span-12 md:col-span-3 bg-white shadow-lg rounded-lg py-4 px-6">
      <transition name="fade" mode="out-in">
        <div v-if="students">
          <h3 class="font-bold text-center">{{ searchDate }} - {{ searchSections.join(", ") }}</h3>
          <p class="text-xs text-center">Students: {{ students.length }} (P={{ presentCount }}, E={{ excusedCount }}, A={{ students.length - presentCount - excusedCount }})</p>

          <!-- In class progress bar -->
          <div
            v-if="dateState.current >= dateState.class.start"
            class="w-full mt-4"
          >
            <div class="w-full bg-gray-200 rounded">
              <div :class="`${dateState.classProgress == 100 ? 'bg-green-500' : dateState.classProgress >= 90 ? 'bg-red-500' : 'bg-yellow-500'} text-xs font-medium text-green-100 text-center p-0.5 leading-none rounded`" :style="`width: ${dateState.classProgress}%`">
                {{Math.round(dateState.classProgress)}}%
              </div>
            </div>
            <div class="flex justify-between">
              <p>{{ dateState.class.startString }}</p>
              <p>{{ dateState.class.endString }}</p>
            </div>
            <p v-if="dateState.current <= dateState.class.end" class="text-xs text-center">{{ Math.round((dateState.class.endTSM - dateState.class.startTSM) * (1 - (dateState.classProgress / 100))) }} minutes remaining</p>
          </div>
          <!-- Before class Time until class -->
          <p v-if="(new Date(`${searchDate}T12:00:00`)).getDate() == dateState.current.getDate() && dateState.current < dateState.class.start">
            Time until class: {{ Math.round((((dateState.class.start - dateState.current) % 86400000)% 3600000)/ 60000) }} minutes
          </p>
          <hr class="mt-4" />
          <button @click="clearSearch" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
            New Search
          </button>
        </div>
        <div v-else>
          <h3 class="text-center">Search Classes</h3>
          <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold" for="search-date">
            Date
          </label>
          <input v-model="searchDate" type="date" id="search-date" class="w-full bg-gray-200 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" />
          <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mt-2" for="search-sections">
            Sections
          </label>
          <select v-model="searchSections" multiple :size="store.state.user.sections.length" class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" id="search-sections">
            <option v-for="section in store.state.user.sections" :key="section" :value="section">{{ section }}</option>
          </select>
          <button @click="searchClasses" :disabled="searching" class="mt-4 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
            Search
          </button>
        </div>
      </transition>
    </div>

    <!-- Results Panel -->
    <transition name="fade" mode="out-in">
      <table
        v-if="students && students.length > 0"
        class="h-fit col-span-12 md:col-span-9 py-4 px-6 divide-y divide-gray-200 shadow-lg mb-6"
      >
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="student in students" :key="student.id">
            <td class="px-6 py-4">{{ student.name }}</td>
            <td class="px-6 py-4">{{ student.section }}</td>
            <td class="px-6 py-4"><toggle :status="student.excused" @toggle="() => markExcused(student)" /></td>
            <td class="px-6 py-4"><toggle :status="student.present" @toggle="() => markPresent(student)" /></td>
          </tr>
        </tbody>
      </table>
    </transition>
  </div>
</template>

<style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
