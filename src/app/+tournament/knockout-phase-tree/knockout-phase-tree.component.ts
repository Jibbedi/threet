import {Component, Input} from '@angular/core';
import {Game} from '../../models/Game';

@Component({
  selector: 'app-knockout-phase-tree',
  templateUrl: './knockout-phase-tree.component.html',
  styleUrls: ['./knockout-phase-tree.component.scss']
})
export class KnockoutPhaseTreeComponent {


  @Input()
  games: Game[];

  @Input()
  stages;

  @Input()
  playerCount: number;

  treeView;

  constructor() {
  }


  ngOnChanges() {
    this.createTreeView();
  }


  createTreeView() {

    if (!this.stages) {
      return;
    }

    const treeView = [];

    const sortedStages = Object.keys(this.stages)
      .map(key => parseInt(key, 10))
      .sort((a, b) => a - b)
      .map(key => this.stages[key]);

    const rounds = Math.log2(this.playerCount);
    let playerCount = this.playerCount;


    for (let round = 0; round < rounds; round++) {
      const gamesInRound = playerCount / 2;

      if (!sortedStages[round]) {
        sortedStages[round] = [];
      }

      while (sortedStages[round].length < gamesInRound) {
        sortedStages[round].push(null);
        console.log(sortedStages[round].length);
      }

      playerCount /= 2;
    }


    sortedStages.reverse().forEach((stage, index) => {
        if (stage.length === 1) {
          treeView.push({name: 'Final', games: stage});
          return;
        }

        const firstHalf = stage.slice(0, stage.length / 2);
        const secondHalf = stage.slice(stage.length / 2, stage.length);
        treeView.unshift({name: 'Round ' + (sortedStages.length - index), games: firstHalf});
        treeView.push({name: 'Round ' + (sortedStages.length - index), games: secondHalf});

      }
    );

    this.treeView = treeView;

  }

  getGameForId(id: string) {
    return this.games.find(game => game.gameId === id);
  }
}
