<script setup>
  import { reactive } from "vue";
  import { query, collection, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
  import { httpsCallable } from "firebase/functions";

  import store from "../store";
  import { db, functions } from "../firebase";
  import AppBar from "../components/AppBar.vue";

  const checkinState = reactive({
    checkingIn: false,
    checkedIn: false,
    excused: false,
    noClass: false,
  });

  const getEST = httpsCallable(functions, "getEST");

  const existingCheckin = async dt => {
    const q = query(
      collection(db, "checkins"),
      where("date", "==", dt.date),
      where("email", "==", store.state.user.email),
      where("section", "in", store.state.user.sections)
    );
    const qsnap = await getDocs(q);

    return [!qsnap.empty, !qsnap.empty ? { ...qsnap.docs[0].data(), id: qsnap.docs[0].id } : null];
  };

  const ongoingClass = async dt => {
    const q = query(
      collection(db, "classes"),
      where("day", "==", dt.day),
      where("section", "in", store.state.user.sections)
    );
    const qsnap = await getDocs(q);

    let ongoing = false;
    let ongoingSection;

    qsnap.forEach(doc => {
      const data = doc.data();
      if (data.start <= dt.tsm && data.end >= dt.tsm) {
        ongoing = true;
        ongoingSection = data.section;
      }
    });

    return [ongoing, ongoingSection];
  };

  const checkin = async () => {
    try {
      checkinState.checkingIn = true;

      const dt = (await getEST()).data;

      // Check if the student is already checked in
      const [checkedIn, checkinData] = await existingCheckin(dt);

      // If the user is checked in
      if (checkedIn) {
        // If the user is not present or excused
        if (!checkinData.present && !checkinData.excused) {
          // update existing record to be present (and updated time) if there is a class ongoing
          const [ongoing, ongoingSection] = await ongoingClass(dt);
          if (ongoing) {
            // update existing record
            await updateDoc(doc(db, "checkins", checkinData.id), {
              present: true,
              timestamp: serverTimestamp(),
            });
            checkinState.checkedIn = true;
          } else {
            // alert noClass
            store.actions.errorToast("Come back during your class.");
            checkinState.noClass = true;
          }
        } else if (checkinData.present) { // If the user is present
          // alert they are checked in
          store.actions.infoToast("You have already checked in.");
          checkinState.checkedIn = true;
        } else if (checkinData.excused) { // If the user is excused
          // alert they are excused
          store.actions.infoToast("You have been excused from this class.");
          checkinState.checkedIn = true;
          checkinState.excused = true;
        }
        return;
      }

      // Check if there is an ongoing class
      // If there is not an ongoing class, alert user, finish function
      const [ongoing, ongoingSection] = await ongoingClass(dt);
      if (!ongoing) {
        // alert noClass
        store.actions.errorToast("Come back during your class.");
        checkinState.noClass = true;
        return;
      }

      // Check the user in
      await addDoc(
        collection(db, "checkins"),
        {
          date: dt.date,
          email: store.state.user.email,
          section: ongoingSection,
          present: true,
          excused: false,
          timestamp: serverTimestamp(),
        }
      );
      store.actions.successToast("Successfully checked you in.");
      checkinState.checkedIn = true;
    } catch (err) {
      store.actions.errorToast("Could not check you in. Please try again shortly or alert your professor.");
      console.log("CHECK IN ERROR", err);
    } finally {
      checkinState.checkingIn = false;
    }
  };
</script>

<template>
  <app-bar />
  <main class="w-screen px-4">
    <h2 class="text-gray-500 text-center text-3xl font-light mb-6">Student</h2>

    <transition name="fade" mode="out-in">
      <div v-if="checkinState.checkedIn" class="mx-auto w-full sm:1/2 md:w-1/4 bg-white shadow-lg rounded-lg py-4 px-6 text-center">
        <p v-if="checkinState.excused">You have been excused from this class. You have <span class="font-bold">not</span> been marked as present. If you are in the room, please speak to your professor.</p>
        <p v-else>You are checked in.</p>
      </div>
      <div v-else-if="checkinState.noClass" class="mx-auto w-full sm:1/2 md:w-1/4 bg-white shadow-lg rounded-lg py-4 px-6 text-center">
        Come back during your class. Email your professor if you forgot to check in.
      </div>
      <div v-else class="mx-auto w-full sm:1/2 md:w-1/4 bg-white shadow-lg rounded-lg py-4 px-6">
        <button @click="checkin" :disabled="checkinState.checkingIn" class="mx-auto block bg-transparent hover:bg-purple-400 text-purple-700 font-semibold hover:text-white py-2 px-4 border border-purple-400 hover:border-transparent rounded duration-200">
          <span v-if="checkinState.checkingIn">Loading!</span>
          <span v-else>Check in</span>
        </button>
      </div>
    </transition>
  </main>
</template>

<style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
