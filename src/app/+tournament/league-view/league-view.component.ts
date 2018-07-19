import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Game} from '../../models/Game';
import {Tournament} from '../../models/Tournament';

@Component({
  selector: 'app-league-view',
  templateUrl: './league-view.component.html',
  styleUrls: ['./league-view.component.css']
})
export class LeagueViewComponent implements OnChanges {


  ranking;

  @Input()
  games: Game[];

  @Input()
  tournament: Tournament;

  @Output()
  startGame = new EventEmitter();

  prices = [];

  getGameForId(id: string) {
    return this.games.find(game => game.gameId === id);
  }

  onGameClick(gameId: string) {
    this.startGame.emit(gameId);
  }

  ngOnChanges() {

    if (!this.games) {
      return;
    }

    this.ranking = Object.values(this.games.reduce((table, game: Game) => {

      const {firstPlayerName, secondPlayerName} = game;


      if (!table[firstPlayerName]) {
        table[firstPlayerName] = this.initializePlayer(firstPlayerName);
      }

      if (!table[secondPlayerName]) {
        table[secondPlayerName] = this.initializePlayer(secondPlayerName);
      }

      if (game.done) {
        this.updatePlayerStats(table[firstPlayerName], this.getFirstPlayerWon(game), game.firstPlayerScore, game.secondPlayerScore);
        this.updatePlayerStats(table[secondPlayerName], !this.getFirstPlayerWon(game), game.secondPlayerScore, game.firstPlayerScore);
      }

      return table;

    }, {}))
      .sort((a: any, b: any) => b.points !== a.points ? b.points - a.points : (b.scoreFor - b.scoreAgainst) - (a.scoreFor - a.scoreAgainst));


    if (this.tournament.done) {
      const totalPot = this.tournament.participantsIds.length * this.tournament.stakePerPlayer;
      const stakePerPlace = this.tournament.splitPercentages.map(percentage => Math.round(percentage / 100 * totalPot));

      this.prices = this.ranking
        .map((player, place) => {
          return {name: player.name, price: stakePerPlace[place] || 0};
        })
        .filter(pricePerPlayer => pricePerPlayer.price);

    }

  }

  private initializePlayer(playerName: string) {
    return {name: playerName, wins: 0, loses: 0, scoreFor: 0, scoreAgainst: 0, points: 0};
  }

  private updatePlayerStats(stats, won, scoreFor, scoreAgainst) {
    stats.wins += won ? 1 : 0;
    stats.loses += !won ? 1 : 0;
    stats.scoreFor += (scoreFor || 0);
    stats.scoreAgainst += (scoreAgainst || 0);
    stats.points = stats.wins * 2;
  }

  private getFirstPlayerWon(game: Game) {
    return game.firstPlayerScore > game.secondPlayerScore;
  }
}
