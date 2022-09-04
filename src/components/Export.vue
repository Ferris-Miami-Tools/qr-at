<script setup>
import { onMounted, ref, reactive } from "vue";
import csvDownload from "json-to-csv-export";
import store from "../store";

const fileInput = ref(null);
const state = reactive({
  processing: false,
  success: false,
  error: "",
  grades: [],
});

const parseGradebook = async () => {
  fileInput.value.click();
};

const fileChange = async e => {
  const reader = new FileReader();

  reader.onload = async v => {
    try {
      state.processing = true;
      state.error = "";

      const headers = {};

      const txtData = v.target.result;
      const table = txtData.split("\n");

      table.shift().split(",").forEach((el, idx) => {
        if (el == "Student") {
          headers.name = idx;
        } else if (el == "SIS User ID") {
          headers.uniqueid = idx+1;
        } else if (el == "Section") {
          headers.section = idx+1;
        } else if (el == "Reading Quizzes Current Score") {
          headers.reading = idx+1;
        } else if (el == "Homework Quizzes Current Score") {
          headers.homework = idx+1;
        } else if (el == "Lab Assignments Current Score") {
          headers.lab = idx+1;
        } else if (el == "Python Exam Current Score") {
          headers.python = idx+1;
        } else if (el == "SQL Exam Current Score") {
          headers.sql = idx+1;
        } else if (el == "Client Challenge Current Score") {
          headers.client = idx+1;
        } else if (el == "Current Score") {
          headers.score = idx+1;
        } else if (el == "Current Grade") {
          headers.grade = idx+1;
        }
      });
      table.shift();
      table.pop();
      table.pop();
      table.map(el => {
        const row = el.replace(/"/g, "").split(",");
        state.grades.push({
          name: row[headers.name].trim() + ", " + row[headers.name+1].trim(),
          uniqueid: row[headers.uniqueid].trim(),
          section: row[headers.section].trim(),
          reading: row[headers.reading] != "" ? Number(row[headers.reading].trim()) : null,
          homework: row[headers.homework] != "" ? Number(row[headers.homework].trim()) : null,
          lab: row[headers.lab] != "" ? Number(row[headers.lab].trim()) : null,
          python: row[headers.python] != "" ? Number(row[headers.python].trim()) : null,
          sql: row[headers.sql] != "" ? Number(row[headers.sql].trim()) : null,
          client: row[headers.client] != "" ? Number(row[headers.client].trim()) : null,
          score: row[headers.score] != "" ? Number(row[headers.score].trim()) : null,
          grade: row[headers.grade] != "" ? row[headers.grade].trim() : null,
        });
      });

      csvDownload(state.grades, 'grades.csv')
      state.success = true;
    } catch (error) {
      state.success = false;
      state.error = error.message;
    } finally {
      state.processing = false;
    }
  };

  reader.readAsText(e.target.files[0]);
};

onMounted(() => {
  if (store.state.students) return;
  store.actions.fetchStudents();
});
</script>

<template>
  <div class="flex justify-center">
    <div class="bg-white shadow-lg rounded-lg py-4 px-6 mb-4 w-full md:w-1/4">
      <h3 class="text-center">Export Data</h3>
      <button @click="() => store.actions.fetchStudents()" :disabled="store.state.loadingStudents" class="mt-2 w-full bg-transparent hover:bg-blue-400 text-blue-700 font-semibold hover:text-white py-3 px-4 border border-blue-400 hover:border-transparent rounded">
        Refresh Student Information
      </button>
      <button @click="() => csvDownload(store.state.students, 'qr-at_attendance.csv')" class="mt-2 w-full bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-3 px-4 border border-purple-400 hover:border-transparent rounded">
        Export Attendance Data
      </button>
      <button @click="parseGradebook" :disabled="state.processing" class="mt-2 w-full bg-transparent hover:bg-green-400 text-green-700 font-semibold hover:text-white py-3 px-4 border border-green-400 hover:border-transparent rounded">
        Parse Gradebook CSV
      </button>
      <p class="text-red-500" v-if="state.error != ''">{{ state.error }}</p>
    </div>
  </div>
  <input @change="fileChange" ref="fileInput" type="file" accepts=".csv" hidden />
</template>
