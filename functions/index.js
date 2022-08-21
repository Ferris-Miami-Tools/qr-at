const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties : true });

const getAttendanceData = async (email, section) => {
  const snapshot = await admin
    .firestore()
    .collection("attendance")
    .where("email", "==", email)
    .where("section", "==", section)
    .get();
  return snapshot.empty ? null : { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
};

const findLastAttended = async (email, section) => {
  const snapshot = await admin.firestore().collection("checkins")
    .where("email", "==", email)
    .where("section", "==", section)
    .where("present", "==", true)
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0].data().date;
};

exports.newCheckin = functions.firestore.document("/checkins/{id}")
  .onCreate(async (snap, _) => {
    const checkinData = snap.data();
    const curAttendance = await getAttendanceData(checkinData.email, checkinData.section);

    if (curAttendance) {
      // Update attendance to increment either present or excused
      // also update lastAttended
      return await admin.firestore().doc("/attendance/"+curAtt.id).update({
        present: checkinData.present ? curAttendance.present + 1 : curAttendance.present,
        excused: checkinData.excused ? curAttendance.excused + 1 : curAttendance.excused,
        lastAttended: checkinData.present ? checkinData.date : curAttendance.lastAttended,
      });
    } else {
      // Create attendance and set either present or excused and lastAttended
      return await admin.firestore().collection("attendance").add({
        email: checkinData.email,
        section: checkinData.section,
        excused: checkinData.excused ? 1 : 0,
        present: checkinData.present ? 1 : 0,
        lastAttended: checkinData.present ? checkinData.date : null,
      });
    }
  });

exports.updatedCheckin = functions.firestore.document("/checkins/{id}")
  .onUpdate(async (change, _) => {
    const previousValue = change.before.data();
    const newValue = change.after.data();
    const curAttendance = await getAttendanceData(newValue.email, newValue.section);

    if (
      previousValue.present != newValue.present
      && newValue.present
    ) {
      // Increment present and update lastAttended to new
      return await admin.firestore().doc("/attendance/"+curAttendance.id).update({
        present: curAttendance.present + 1,
        lastAttended: newValue.date,
      });
    } else if (
      previousValue.present != newValue.present
      && !newValue.present
    ) {
      // Decrement present and find new lastAttended to use
      const lastAttended = await findLastAttended(newValue.email, newValue.section);
      return await admin.firestore().doc("/attendance/"+curAttendance.id).update({
        present: curAttendance.present - 1,
        lastAttended,
      });
    } else if (
      previousValue.excused != newValue.excused
      && newValue.excused
    ) {
      // Increment excused and find new lastAttended to use
      const lastAttended = await findLastAttended(newValue.email, newValue.section);
      return await admin.firestore().doc("/attendance/"+curAttendance.id).update({
        excused: curAttendance.excused + 1,
        lastAttended,
      });
    } else if (
      previousValue.excused != newValue.excused
      && !newValue.excused
    ) {
      // Decrement excused and find new lastAttended to use
      const lastAttended = await findLastAttended(newValue.email, newValue.section);
      return await admin.firestore().doc("/attendance/"+curAttendance.id).update({
        excused: curAttendance.excused - 1,
        lastAttended,
      });
    }
  });
