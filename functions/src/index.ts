import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

var EloRating = require('elo-rating');


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

    if (!game.done) {
      console.log('not done');
      return Promise.resolve(true);
    }

    console.log('done');


    const firstPlayerId = game.firstPlayerId;
    const secondPlayerId = game.secondPlayerId;
    const firstPlayerWon = game.firstPlayerScore > game.secondPlayerScore;


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
    })).then(r => {

      return Promise.all([admin
        .firestore()
        .collection('players').doc(firstPlayerId).get(), admin
        .firestore()
        .collection('players').doc(secondPlayerId).get()]).then(players => {
        const firstPlayerElo = players[0].data().eloRank || 1000;
        const secondPlayerElo = players[1].data().eloRank || 1000;

        const result = EloRating.calculate(firstPlayerElo, secondPlayerElo, firstPlayerWon);

        return Promise.all([admin
          .firestore()
          .collection('players').doc(firstPlayerId).update({eloRank: result.playerRating}), admin
          .firestore()
          .collection('players').doc(secondPlayerId).update({eloRank: result.opponentRating})]);

      });
    });
  });


