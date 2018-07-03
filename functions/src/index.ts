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
    const game = event.data.data();
    const firstPlayerId = game.firstPlayerId;
    const secondPlayerId = game.secondPlayerId;

    const wherePlayerIsFirstPlayerGames = admin
      .firestore()
      .collection('games')
      .where('firstPlayerId', '==', firstPlayerId)
      .get();


    return Promise.all([wherePlayerIsFirstPlayerGames])
      .then(snapshots => {
        let totalWins = 0;
        let totalLoses = 0;

        snapshots.forEach(snapShot => snapShot.docs.forEach(doc => {
          const game = doc.data();
          if (game.firstPlayerScore > game.secondPlayerScore) {
            totalWins++;
          } else {
            totalLoses++;
          }
        }));


        return admin.firestore().collection('players').doc(firstPlayerId).update({
          totalWins,
          totalLoses,
          winPercentage: totalWins / (totalWins + totalLoses)
        });

      });

  });


