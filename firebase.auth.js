const { db } = require("./admin.firebase.js");

const verifyAndCreateUser = async (username, name, email, password) => {
  const usersRef = db.collection('users');
  const query = usersRef.where('email', '==', email);
  try {
    const querySnapshot = await query.get();
    if (querySnapshot.empty) {
      // User doesn't exist, create a new one
      const id = db.collection('users').doc().id;
      await usersRef.doc(id).set({
        name: name,
        username: username,
        email: email,
        password: password,
        userId: id
      });
      console.log("Document written with id: "+id);
      return {code: 200, message: "user was created"};
    } else {
      console.log('User already exists');
      return {code: 500, message: "user exists"};
    }
  } catch (error) {
    console.error(error);
    return {code: 500, message: "user creation error"};
  }
}

const verifyAndLogUserIn = async (email, password) => {
  const usersRef = db.collection('users');
  const query = usersRef.where('email', '==', email).where('password', '==', password).select("email", "password", "userId").limit(1);
  try {
    const querySnapshot = await query.get();
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0];
      return userData.data();
    }
  } catch(err) {
    console.log(err)
  }
}
module.exports = { verifyAndCreateUser, verifyAndLogUserIn };
