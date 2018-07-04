import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

var EloRating = require('elo-rating');


function calculateStreak(currentStreak = 0, win: boolean) {
  const impact = win ? +1 : -1;

  if (currentStreak >= 0 && !win) {
    return impact;
  } else if (currentStreak < 0 && win) {
    return impact;
  } else {
    return currentStreak + impact;
  }
}

function rewriteHistory(history = [], win: boolean) {
  history.push(win);
  if (history.length > 5) {
    history.shift();
  }
  return history;
}


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
          let totalScoreFor = 0;
          let totalScoreAgainst = 0;

          snapshots.forEach(snapShot => snapShot.docs.forEach(doc => {
            const g = doc.data();

            if (g.done) {
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

              if (g.firstPlayerId === id) {
                totalScoreFor += g.firstPlayerScore;
                totalScoreAgainst += g.secondPlayerScore;
              } else {
                totalScoreFor += g.secondPlayerScore;
                totalScoreAgainst += g.firstPlayerScore;
              }

            }
          }));


          return admin.firestore().collection('players').doc(id).update({
            totalWins,
            totalLoses,
            totalScoreFor,
            totalScoreAgainst,
            totalScoreDiff: totalScoreFor - totalScoreAgainst,
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


        const firstPlayerStreak = calculateStreak(players[0].data().streak, firstPlayerWon);
        const secondPlayerStreak = calculateStreak(players[1].data().streak, !firstPlayerWon);

        const firstPlayerHistory = rewriteHistory(players[0].data().history, firstPlayerWon);
        const secondPlayerHistory = rewriteHistory(players[1].data().history, !firstPlayerWon);

        return Promise.all([admin
          .firestore()
          .collection('players').doc(firstPlayerId).update({
            eloRank: result.playerRating,
            streak: firstPlayerStreak,
            longestNegativeStreak: Math.min(firstPlayerStreak, players[0].data().longestNegativeStreak || 0),
            longestPositiveStreak: Math.max(firstPlayerStreak, players[0].data().longestPositiveStreak || 0),
            history: firstPlayerHistory
          }), admin
          .firestore()
          .collection('players').doc(secondPlayerId).update({
            eloRank: result.opponentRating,
            streak: secondPlayerStreak,
            longestNegativeStreak: Math.min(secondPlayerStreak, players[1].data().longestNegativeStreak || 0),
            longestPositiveStreak: Math.max(secondPlayerStreak, players[1].data().longestPositiveStreak || 0),
            history: secondPlayerHistory
          })]);

      });
    });
  });


exports.preMatchInfo = functions.https.onCall((data, context) => {
  const expectedWinFirstPlayer = Math.round(EloRating.expected(data.firstPlayerEloRank, data.secondPlayerEloRank) * 100);
  return {expectedWinFirstPlayer, expectedWinSecondPlayer: 100 - expectedWinFirstPlayer};
});

