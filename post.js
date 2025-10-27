const { db } = require("./admin.firebase.js");

async function createPost(postMeta) {
  const { text, mediaData, uuid, reactions, timestamp } = postMeta;
  const { mediaURL, mediaType } = mediaData;
  const { likes, comments, dislikes } = reactions;
  const h = [];
  text.replace(/#\w+/g, (match) => {
    h.push(match);
  });
  console.log(h)
  const postRef = db.collection('posts');
  const userRef = db.collection('users');
  const user_query = userRef.where('userId', '==', uuid).limit(1);
  const userQuerySnapshot = await user_query.get();
  if (!userQuerySnapshot.empty) {
    const id = db.collection('posts').doc().id;
    await postRef.doc(id).set({
      userId: uuid,
      text: text,
      mediaData: {
        mediaURL: mediaURL,
        mediaType: mediaType
      },
      hashtags: h,
      timestamp: timestamp,
      reactions: {
        likes: likes,
        comments: comments,
        dislikes: dislikes
      },
      postId: id
    });
    return id;
  } else {
    return {code: 404, message: "user not found"};
  }
}

async function getPost(uid) {
  const postRef = db.collection("posts");
  //const query = await postRef.where("userId", "==", uid);
  const query_snapshot = await postRef.get();
  if(!query_snapshot.empty) {
    const data = query_snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  } else {
    return "Error";
  }
}

module.exports = { createPost, getPost };