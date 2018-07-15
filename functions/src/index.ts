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

function calculateTournament(event, stage = '') {
  const game = event.after.data();
  const {tournamentId} = game;

  if (!tournamentId || !game.done) {
    return Promise.resolve(true);
  }

  const winnerId = game.firstPlayerScore > game.secondPlayerScore ? game.firstPlayerId : game.secondPlayerId;
  const winnerName = game.firstPlayerScore > game.secondPlayerScore ? game.firstPlayerName : game.secondPlayerName;


  return admin.firestore()
    .collection(stage + 'tournaments')
    .doc(tournamentId)
    .get()
    .then(tournamentSnapshot => {
        const tournament = tournamentSnapshot.data();


        const sortedStages = Object.keys(tournament.stages)
          .map(key => parseInt(key, 10))
          .sort((a, b) => a - b)
          .map(key => tournament.stages[key]);

        const currentStageIndex = sortedStages
          .findIndex(sortedStage => sortedStage.includes(game.gameId));


        const rounds = Math.log2(tournament.participantsIds.length);

        if (rounds === (currentStageIndex + 1) && game.done) {

          const playersGetEloStake = tournament
            .participantsIds
            .filter(id => id !== winnerId)
            .map(id => admin
              .firestore()
              .collection(stage + 'players')
              .doc(id)
              .get()
              .then(snapShot => {
                return snapShot
                  .ref
                  .update({eloRank: snapShot.data().eloRank - tournament.stakePerPlayer});
              }));

          return Promise.all([playersGetEloStake])
            .then(writes => admin
              .firestore()
              .collection(stage + 'players')
              .doc(winnerId)
              .get()
              .then(winnerSnapShot => {
                console.log('winnerId');
                console.log(winnerId);
                console.log(winnerSnapShot.id);
                return winnerSnapShot.ref.update({
                  tournamentWins: (winnerSnapShot.data().tournamentWins || 0) + 1,
                  eloRank: winnerSnapShot.data().eloRank + (tournament.stakePerPlayer * (tournament.participantsIds.length - 1))
                });
              })
              .then(_ => {
                return tournamentSnapshot.ref.update({done: true, winnerId, winnerName});
              }));
        }


        const currentGameIndex = sortedStages[currentStageIndex].indexOf(game.gameId);

        if (!tournament.stages[currentStageIndex + 1]) {
          tournament.stages[currentStageIndex + 1] = [];
        }

        const tournamentStage = tournament.stages[currentStageIndex + 1];
        const nextStageGameIndex = Math.floor(currentGameIndex / 2);


        if (!tournamentStage[nextStageGameIndex]) {
          console.log('new game');
          return admin.firestore()
            .collection(stage + 'games')
            .add({
              firstPlayerId: winnerId,
              firstPlayerName: winnerName,
              done: false,
              shouldEffectElo: tournament.shouldEffectElo,
              shouldEffectRank: tournament.shouldEffectRank,
              mode: 'knockout',
              tournamentId: tournamentId
            }).then(gameWrite => {
              tournamentStage[nextStageGameIndex] = gameWrite.id;
              return tournamentSnapshot.ref.update({stages: tournament.stages});
            });
        } else {
          console.log('adjust game');
          console.log(nextStageGameIndex);
          return admin.firestore()
            .collection(stage + 'games')
            .doc(tournamentStage[nextStageGameIndex])
            .update({
              secondPlayerId: winnerId,
              secondPlayerName: winnerName
            });
        }
      }
    );
}

function createKnockoutTournament(event, stage = '') {
  const participants = shuffle(event.data().participantsIds);

  const gamesCollection = admin.firestore().collection(stage + 'games');
  const gameWrites = [];

  for (let i = 0; i < participants.length; i += 2) {
    gameWrites.push(
      Promise.all([getPlayerById(participants[i], stage), getPlayerById(participants[i + 1], stage)])
        .then(players => {
          return gamesCollection.add({
            firstPlayerId: players[0].id,
            secondPlayerId: players[1].id,
            firstPlayerName: players[0].name,
            secondPlayerName: players[1].name,
            done: false,
            mode: 'knockout',
            shouldEffectElo: event.data().shouldEffectElo,
            shouldEffectRank: event.data().shouldEffectRank,
            tournamentId: event.id
          });
        })
    );
  }

  return Promise.all(gameWrites).then(gameWritesResponses => {
      return event
        .ref
        .update('stages', {0: gameWritesResponses.map(gameWrite => gameWrite.id)});
    }
  );
}

function calculateWins(event, stage = '') {
  const game = event.after.data();

  if (!game) {
    return event.before.ref.update({gameId: event.after.id});
  }

  if (!game.done) {
    console.log('not done');
    return !game.gameId ? event.after.ref.update({gameId: event.after.id}) : Promise.resolve(true);
  }

  console.log('done');


  const firstPlayerId = game.firstPlayerId;
  const secondPlayerId = game.secondPlayerId;
  const firstPlayerWon = game.firstPlayerScore > game.secondPlayerScore;


  return Promise.all([firstPlayerId, secondPlayerId].map(id => {

    const wherePlayerIsFirstPlayerGames = admin
      .firestore()
      .collection(stage + 'games')
      .where('firstPlayerId', '==', id)
      .get();

    const wherePlayerIsSecondPlayerGames = admin
      .firestore()
      .collection(stage + 'games')
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


        return admin.firestore().collection(stage + 'players').doc(id).update({
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
      .collection(stage + 'players').doc(firstPlayerId).get(), admin
      .firestore()
      .collection(stage + 'players').doc(secondPlayerId).get()]).then(players => {
      const firstPlayerElo = players[0].data().eloRank || 1000;
      const secondPlayerElo = players[1].data().eloRank || 1000;

      const result = EloRating.calculate(firstPlayerElo, secondPlayerElo, firstPlayerWon);


      const firstPlayerStreak = calculateStreak(players[0].data().streak, firstPlayerWon);
      const secondPlayerStreak = calculateStreak(players[1].data().streak, !firstPlayerWon);

      const firstPlayerHistory = rewriteHistory(players[0].data().history, firstPlayerWon);
      const secondPlayerHistory = rewriteHistory(players[1].data().history, !firstPlayerWon);

      return Promise.all([admin
        .firestore()
        .collection(stage + 'players').doc(firstPlayerId).update({
          eloRank: game.shouldEffectElo === false ? firstPlayerElo : result.playerRating,
          streak: firstPlayerStreak,
          longestNegativeStreak: Math.min(firstPlayerStreak, players[0].data().longestNegativeStreak || 0),
          longestPositiveStreak: Math.max(firstPlayerStreak, players[0].data().longestPositiveStreak || 0),
          history: firstPlayerHistory
        }), admin
        .firestore()
        .collection(stage + 'players').doc(secondPlayerId).update({
          eloRank: game.shouldEffectElo === false ? secondPlayerElo : result.opponentRating,
          streak: secondPlayerStreak,
          longestNegativeStreak: Math.min(secondPlayerStreak, players[1].data().longestNegativeStreak || 0),
          longestPositiveStreak: Math.max(secondPlayerStreak, players[1].data().longestPositiveStreak || 0),
          history: secondPlayerHistory
        })]);

    });
  });
}


exports.calculateWinsProd = functions.firestore
  .document('games/{gamesId}')
  .onWrite(event => {
    return calculateWins(event);
  });

exports.calculateWinsDev = functions.firestore
  .document('dev_games/{gamesId}')
  .onWrite(event => {
    return calculateWins(event, 'dev_');
  });

exports.calculateTournamentProd = functions.firestore
  .document('games/{gamesId}')
  .onUpdate(event => {
    return calculateTournament(event);
  });

exports.calculateTournamentDev = functions.firestore
  .document('dev_games/{gamesId}')
  .onUpdate(event => {
    return calculateTournament(event, 'dev_');
  });

exports.createKnockoutTournamentProd = functions.firestore
  .document('tournaments/{tournamentId}')
  .onCreate(event => {
    return createKnockoutTournament(event);
  });

exports.createKnockoutTournamentDev = functions.firestore
  .document('dev_tournaments/{tournamentId}')
  .onCreate(event => {
    return createKnockoutTournament(event, 'dev_');
  });

exports.preMatchInfo = functions.https.onCall((data, context) => {
  const expectedWinFirstPlayer = Math.round(EloRating.expected(data.firstPlayerEloRank, data.secondPlayerEloRank) * 100);
  return {expectedWinFirstPlayer, expectedWinSecondPlayer: 100 - expectedWinFirstPlayer};
});

exports.moveTo = functions.https.onCall((data, context) => {

  const collections = ['games', 'players'];

  return Promise.all(
    collections.map(collectionName => admin
      .firestore()
      .collection(collectionName)
      .get()
    )
  ).then((collectionSnapshots) => {
    const writes = [];

    collectionSnapshots.forEach((collectionSnapshot, index) => {
      collectionSnapshot.forEach(doc => {
        writes.push(admin.firestore().collection(data + '_' + collections[index]).doc(doc.id).set(doc.data()));
      });
    });

    return Promise.all(writes);
  })
    .then(writes => {
      return {status: 200};
    });
});


function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPlayerById(id: string, stage: string) {
  return admin
    .firestore()
    .collection(stage + 'players')
    .doc(id)
    .get()
    .then(snapshot => snapshot.data());
}

