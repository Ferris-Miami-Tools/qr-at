import { reactive } from "vue";
import { useToast } from "vue-toastification";
import { onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signOut } from "firebase/auth";
import { doc, query, collection, where, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";

const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toast = useToast();

onAuthStateChanged(auth, async user => {
  if (!user) {
    mutations.setUser(null);
    return;
  }

  if (!user.email.includes("@miamioh.edu")) {
    actions.errorToast("Please use your @miamioh.edu email.");
    actions.logout();
    return;
  }

  const usr = {
    id: user.uid,
    email: user.email,
  };

  const docRef = doc(db, "users", usr.email);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    actions.errorToast("You are not authorized. Contact Joshua Ferris if you think this is an error.");
    mutations.setUser(null);
    return;
  }

  mutations.setUser({
    ...usr,
    ...docSnap.data(),
  });
  actions.successToast(`Welcome back ${state.user.name}`);
});

const state = reactive({
  user: undefined,
  students: null,
  student: null,
  studentAttendance: null,
  loadingStudents: false,
  lastUpdated: null,
  classes: null,
  loadingClasses: true,
});

const mutations = {
  setUser: v => state.user = v,
  setStudents: v => state.students = v,
  setStudent: v => {
    state.student = v;
  },
  setStudentAttendance: v => state.studentAttendance = v,
  setClasses: v => state.classes = v,
};

const actions = {
  errorToast: msg => toast.error(msg),
  infoToast: msg => toast.info(msg),
  login: async () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  },
  logout: async () => {
    mutations.setUser(null);
    signOut(auth);
  },
  successToast: msg => toast.success(msg),
  fetchClasses: async () => {
    try {
      state.loadingClasses = true;

      let classes = [];
      const q = query(
        collection(db, "classes"),
        where("section", "in", state.user.sections)
      );
      const qsnap = await getDocs(q);

      qsnap.forEach(aClass => {
        const data = aClass.data();

        const startHours = Math.floor(data.start / 60);
        const startMinutes = String(data.start - (startHours * 60)).padStart(2, "0");
        const endHours = Math.floor(data.end / 60);
        const endMinutes = String(data.end - (endHours * 60)).padStart(2, "0");

        classes.push({
          section: data.section,
          dayNum: data.day,
          day: dow[data.day],
          start: `${startHours}:${startMinutes}`,
          end: `${endHours}:${endMinutes}`,
        });
      });
      classes.sort((a, b) => a.section == b.section ? a.dayNum - b.dayNum : a.section.localeCompare(b.section));
      mutations.setClasses(classes);
    } catch (err) {
      console.log("ERROR | Fetching classes.", err);
      actions.errorToast("Error fetching classes. Please try again shortly.");
    } finally {
      state.loadingClasses = false;
    }
  },
  fetchStudents: async () => {
    try {
      state.loadingStudents = true;
      mutations.setStudents(null);
      let students = [];
      const q = query(
        collection(db, "attendance"),
        where("section", "in", state.user.sections)
      );
      const qsnap = await getDocs(q);
      qsnap.forEach(doc => {
        const data = doc.data();

        if (data.lastAttended) {
          const dateSplit = data.lastAttended.split("-");
          students.push({
            id: doc.id,
            ...data,
            lastAttended: `${dateSplit[1]}-${dateSplit[2]}-${dateSplit[0]}`,
          });
        } else {
          students.push({
            id: doc.id,
            ...data,
            lastAttended: "N/A",
          });
        }
      });
      students.sort((a, b) => a.name.split(" ")[1] > b.name.split(" ")[1]);
      mutations.setStudents(students);
      state.lastUpdated = (new Date()).toLocaleString();
      actions.infoToast("Successfully updated student list");
    } catch (err) {
      console.log("ERROR | Fetching students.", err);
      actions.errorToast("Error fetching students. Please try again shortly.");
    } finally {
      state.loadingStudents = false;
    }
  },
};

export default { state, mutations, actions };
