import { reactive } from "vue";
import { useToast } from "vue-toastification";
import { onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signOut } from "firebase/auth";
import { doc, query, collection, where, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";

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
});

const mutations = {
  setUser: v => state.user = v,
  setStudents: v => state.students = v,
  setStudent: v => {
    state.student = v;
  },
  setStudentAttendance: v => state.studentAttendance = v,
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
        const dateSplit = data.lastAttended.split("-");
        students.push({
          id: doc.id,
          ...data,
          lastAttended: `${dateSplit[1]}-${dateSplit[2]}-${dateSplit[0]}`,
        });
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
