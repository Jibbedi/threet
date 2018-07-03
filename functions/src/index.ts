import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.calculateWins = functions.firestore
  .document('games/{gamesId}')
  .onWrite(event => {
    const game = event.after.data();
    const firstPlayerId = game.firstPlayerId;
    const secondPlayerId = game.secondPlayerId;


    return Promise.all([firstPlayerId, secondPlayerId].map(id => {

      const wherePlayerIsFirstPlayerGames = admin
        .firestore()
        .collection('games')
        .where('firstPlayerId', '==', id)
        .get();

      const wherePlayerIsSecondPlayerGames = admin
        .firestore()
        .collection('games')
        .where('secondPlayerId', '==', id)
        .get();


      return Promise.all([wherePlayerIsFirstPlayerGames, wherePlayerIsSecondPlayerGames])
        .then(snapshots => {
          let totalWins = 0;
          let totalLoses = 0;

          snapshots.forEach(snapShot => snapShot.docs.forEach(doc => {
            const g = doc.data();
            if (g.firstPlayerScore > g.secondPlayerScore) {
              if (g.firstPlayerId === id) {
                totalWins++;
              } else {
                totalLoses++;
              }
            } else {
              if (g.secondPlayerId === id) {
                totalWins++;
              } else {
                totalLoses++;
              }
            }
          }));


          return admin.firestore().collection('players').doc(id).update({
            totalWins,
            totalLoses,
            winPercentage: totalWins / (totalWins + totalLoses)
          });

        });
    }));
  });


