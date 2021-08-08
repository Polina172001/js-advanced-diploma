import GamePlay from "./GamePlay";
import themes from './themes';
import GameState from './GameState';
import Team from "./Team";
export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.userTeam = new Team();
    this.computerTeam = new Team();
    this.computerCharacter = [Daemon, Undead, Vampire];
    this.userCharacter = [Bowman, Swordsman, Magician];
    this.gameState = new GameState();
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.drawUi(themes[this.GameState.level]);
    this.userTeam.addAll(generateTeam([Bowman, Swordsman], 1, 2));
    this.computerTeam.addAll(generateTeam(this.computerCharacter, 1, 2));
  }

  onCellClick(index) {
    // TODO: react to click
    if (this.gameState.level === 5 || this.userTeam.members.size === 0) {
      return;
    }

    //Реализуем атаку 

  }

  onCellEnter(index) {
    // TODO: react to mouse enter
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
  }
}
