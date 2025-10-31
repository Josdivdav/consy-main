const { db, admin } = require("./admin.firebase.js");

async function createPost(postMeta) {
  const { text, mediaFiles, pid, reactions, timestamp } = postMeta;
  const { likes, comments } = reactions;
  const postRef = db.collection('posts');
  const userRef = db.collection('users');
  const user_query = userRef.where('portalID', '==', pid).limit(1);
  const userQuerySnapshot = await user_query.get();
  if (!userQuerySnapshot.empty) {
    const id = db.collection('posts').doc().id;
    await postRef.doc(id).set({
      portalID: pid,
      text: text,
      mediaFiles: mediaFiles,
      timestamp: timestamp,
      reactions: {
        likes: likes,
        comments: comments,
      },
      postId: id
    });
    return id;
  } else {
    return {code: 404, message: "user not found"};
  }
}

async function getPost(pid) {
  const postRef = db.collection("posts");
  const query_snapshot = await postRef.get();
  if(!query_snapshot.empty) {
    const data = query_snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  } else {
    return "Error";
  }
}
async function reactionControlLike(pid, portalId) {
  const postRef = db.collection("posts").doc(pid);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(postRef);
      if (!doc.exists) {
        throw new Error("Post not found");
      }

      const reactions = doc.data().reactions || {};
      const likes = reactions.likes || [];

      if (!likes.includes(portalId)) {
        transaction.update(postRef, {
          'reactions.likes': admin.firestore.FieldValue.arrayUnion(portalId)
        });
      } else{
        transaction.update(postRef, {
          'reactions.likes': admin.firestore.FieldValue.arrayRemove(portalId)
        })
      }
    });
    return (await postRef.get()).data();
  } catch (error) {
    console.error(error);
    return "Error";
  }
}

module.exports = { createPost, getPost, reactionControlLike };