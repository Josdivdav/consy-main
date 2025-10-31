const { db } = require("./admin.firebase.js");
async function getUserData(uid) {
  const usersRef = db.collection('users');
  const query = usersRef.where('portalID', '==', uid).limit(1);
  try {
    const querySnapshot = await query.get();
    if (!querySnapshot.empty) {
      const userData = (querySnapshot.docs[0]).data();
      const { password, ...rest } = userData;
      return rest;
    }
  } catch(err) {
    console.log(err)
  }
}
async function getUsers() {
  const usersRef = db.collection('users');
  //const query = usersRef.where('userId', '==', uid).limit(1);
  try {
    const querySnapshot = await usersRef.get();
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data;
    }
  } catch(err) {
    console.log(err)
  }
}
module.exports = { getUserData, getUsers };