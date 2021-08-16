import GamePlay from './GamePlay';
import themes from './themes';
import GameState from './GameState';
import Team from './Team';
import {
  generateTeam
} from './generators';
import Bowman from './Characters/Bowman';
import Swordsman from './Characters/Swordsman';
import Daemon from './Characters/Daemon';
import Undead from './Characters/Undead';
import Vampire from './Characters/Vampire';
import Magician from './Characters/Magician';
import PositionedCharacter from './PositionedCharacter';
import cursors from './cursors';
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
    this.addTheTeamToPosition(this.userTeam, this.getUserStartPositions());
    this.addTheTeamToPosition(this.computerTeam, this.getComputerStartPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
    GamePlay.showMessage(`Уровень ${this.gameState.level}`);
  }

  onCellClick(index) {
    // TODO: react to click
    if (this.gameState.level === 5 || this.userTeam.members.size === 0) {
      return;
    }

    //Реализуем атаку 
    if (this.gameState.selected !== null && this.getItem(index) && this.isComputerItem(index)) {
      if (this.isAttack(index)) {
        this.getAttack(index, this.gameState.selected);
      }
    }

    //перемещение игрока
    if (this.gameState.selected !== null && this.isMoving(index) && !this.getItem(index)) {
      if (this.gameState.isUsersTurn) {
        this.getUsersTurn(index);
      }
    }

    //ошибка хода
    if (this.gameState.selected !== null && !this.isMoving(index) && !this.isAttack(index)) {
      if (this.gameState.isUsersTurn && !this.getItem(index)) {
        GamePlay.showError('Ошибка хода');
      }
    }

    //при клике на пустую ячейку return
    if (!this.getItem(index)) {
      return;
    }

    //клик на компьютерного игрока ошибка
    if (this.getItem(index) && this.isComputerItem(index) && !this.isAttack(index)) {
      GamePlay.showError('Чужой персонаж');
    }

    //при клике на игрока выделяем желтым ячейку
    if (this.getItem(index) && this.isUserItem(index)) {
      this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-green'));
      this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-yellow'));
      this.gamePlay.selectCell(index);
      this.gameState.selected = index;
    }

  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    // Если игрок при наведении на ячейку курсор = pointer
    if (this.getItem(index) && this.isUserItem(index)) {
      this.gamePlay.setCursor(cursors.pointer);
    }

    // Если диапазон перемещения, то выделяем ячейку зелёным
    if (this.gameState.selected !== null && !this.getItem(index) && this.isMoving(index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    }

    // При наведении на игрока показываем инфо
    if (this.getItem(index)) {
      const item = this.getItem(index).character;
      const message = `\u {
        1 F396
      }
      $ {
        item.level
      }\
      u {
        2694
      }
      $ {
        item.attack
      }\
      u {
        1 F6E1
      }
      $ {
        item.defence
      }\
      u {
        2764
      }
      $ {
        item.health
      }`;
      this.gamePlay.showCellTooltip(message, index);
    }

    // Если  диапазон атаки, то  выделяем ячейку красным
    if (this.gameState.selected !== null && this.getItem(index) && !this.isUserItem(index)) {
      if (this.isAttack(index)) {
        this.gamePlay.setCursor(cursors.crosshair);
        this.gamePlay.selectCell(index, 'red');
      }
    }

    // Если не валидные диапазоны атаки и перемещения , то курсор = notallowed
    if (this.gameState.selected !== null && !this.isAttack(index) && !this.isMoving(index)) {
      if (!this.isUserItem(index)) {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-red'));
    this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-green'));
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor(cursors.auto);
  }

  /** 
   * Функция наносит атаку противнику
   * @param {number} idx индекс компьютера
   * @returns
   */

  getAttack(idx) {
    if (this.gameState.isUsersTurn) {
      const attacker = this.getItem(this.gameState.selected).character;
      const target = this.getItem(idx).character;
      const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);
      if (!attacker || !target) {
        return;
      }
      this.gamePlay.showDamage(idx, damage).then(() => {
        target.health -= damage;
        if (target.health <= 0) {
          this.getDeletion(idx);
          this.computerTeam.delete(target);
        }
      }).then(() => {
        this.gamePlay.redrawPositions(this.gameState.allPositions);
      }).then(() => {
        this.getGameResult();
        this.getComputerResponse();
      });
      this.gameState.isUsersTurn = false;
    }
  }

  /** 
   * Функция перемещения персонажа по клику валидному
   * @param {number} idx индекс ячейки перемещения
   */

  getUsersTurn(idx) {
    this.getSelectedItem().position = idx;
    this.gamePlay.deselectCell(this.gameState.selected);
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    this.gameState.selected = idx;
    this.gameState.isUsersTurn = false;
    this.getComputerResponse();
  }

  /** 
   * Функция наносит атаку комп игрока и перемещение
   * @returns наноси урон игроку, рандомно выбирает комп игрока и перемещение
   */

  getComputerResponse() {
    if (this.gameState.isUsersTurn) {
      return;
    }

    const computersTeam = this.gameState.allPositions.filter((e) => (
      e.character instanceof Vampire ||
      e.character instanceof Daemon ||
      e.character instanceof Undead
    ));

    const usersTeam = this.gameState.allPositions.filter((e) => (
      e.character instanceof Bowman ||
      e.character instanceof Swordsman ||
      e.character instanceof Magician
    ));

    let computer = null;
    let target = null;

    if (computersTeam.length === 0 || usersTeam.length === 0) {
      return;
    }

    computersTeam.forEach((elem) => {
      const rangeAttack = this.calcRange(elem.position, elem.character.attackRange);
      usersTeam.forEach((val) => {
        if (rangeAttack.includes(val.position)) {
          computer = elem;
          target = val;
        }
      });
    });

    if (target) {
      const damage = Math.max(
        computer.character.attack - target.character.defence, computer.character.attack * 0.1,
      );
      this.gamePlay.showDamage(target.position, damage).then(() => {
        target.character.health -= damage;
        if (target.character.health <= 0) {
          this.getDeletion(target.position);
          this.userTeam.delete(target.character);
          this.gamePlay.deselectCell(this.gameState.selected);
          this.gameState.selected = null;
        }
      }).then(() => {
        this.gamePlay.redrawPositions(this.gameState.allPositions);
        this.gameState.isUsersTurn = true;
      }).then(() => {
        this.getGameResult();
      });
    } else {
      computer = computersTeam[Math.floor(Math.random() * computersTeam.length)];
      const computerRange = this.calcRange(computer.position, computer.character.distance);

      computerRange.forEach((e) => {
        this.gameState.allPositions.forEach((i) => {
          if (e === i.position) {
            computerRange.splice(computerRange.indexOf(i.position), 1);
          }
        });
      });

      const computerPos = this.getRandom(computerRange);
      computer.position = computerPos;

      this.gamePlay.redrawPositions(this.gameState.allPositions);
      this.gameState.isUsersTurn = true;
    }
  }

  /**
   * Функция поверяет состояние игры после хода "Победа / Поражение / Повышение уровня"
   */

  getGameResult() {
    if (this.userTeam.members.size === 0) {
      this.gameState.statistics.push(this.gameState.points);
      GamePlay.showMessage(`Проиграли:( Количество очков ${this.gameState.points}`);
    }

    if (this.computerTeam.members.size === 0 && this.gameState.level === 4) {
      this.scoringPoints();
      this.gameState.statistics.push(this.gameState.points);
      GamePlay.showMessage(`Победа!!! Количество очков ${this.gameState.points},
      Максимальное количество очков ${Math.max(...this.gameState.statistics)}`);
      this.gameState.level += 1;
    }

    if (this.computerTeam.members.size === 0 && this.gameState.level <= 3) {
      this.gameState.isUsersTurn = true;
      this.scoringPoints();
      GamePlay.showMessage(`Уровень ${this.gameState.level} пройден! ,
      Количетво очков ${this.gameState.points}`);
      this.gameState.level += 1;
      this.getLevelUp();
    }
  }

  /**
   * Функция перехода на след уровень
   */
  getLevelUp() {
    this.gameState.allPositions = [];
    this.userTeam.members.forEach((item) => item.levelUp());

    if (this.gameState.level === 2) {
      this.userTeam.addAll(generateTeam(this.userCharacter, 1, 1));
      this.computerTeam.addAll(generateTeam(this.computerCharacter, 2, this.userTeam.members.size));
    }

    if (this.gameState.level === 3) {
      this.userTeam.addAll(generateTeam(this.userCharacter, 2, 2));
      this.computerTeam.addAll(generateTeam(this.computerCharacter, 3, this.userTeam.members.size));
    }

    if (this.gameState.level === 4) {
      this.userTeam.addAll(generateTeam(this.userCharacter, 3, 2));
      this.computerTeam.addAll(generateTeam(this.computerCharacter, 4, this.userTeam.members.size));
    }

    GamePlay.showMessage(`Уровень ${this.gameState.level}`);
    this.gamePlay.drawUi(themes[this.gameState.level]);
    this.addTheTeamToPosition(this.userTeam, this.getUserStartPositions());
    this.addTheTeamToPosition(this.computerTeam, this.getComputerStartPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
  }

  /**
   * Функция начисления очков после прохода уровня
   */
  scoringPoints() {
    this.gameState.points += this.userTeam.toArray().reduce((a, b) => a + b.health, 0);
  }

  /**
   * Функция удаляет персонажа из поля 
   * @param {number} idx индекс игрока
   */
  getDeletion(idx) {
    const state = this.gameState.allPositions;
    state.splice(state.indexOf(this.getItem(idx)), 1);
  }

  /**
   * Функция проверяет правильный диапозон перемещения
   * @param {number} idx индекс игрока
   * @returns boolean
   */
  isMoving(idx) {
    if (this.getSelectedItem()) {
      const moving = this.getSelectedItem().character.distance;
      const arr = this.calcRange(this.gameState.selected, moving);
      return arr.includes(idx);
    }
    return false;
  }

  /**
   * Функция проверяет правильный диапозон атаки
   * @param {number} idx индекс игрока
   * @returns boolean
   */
  isAttack(idx) {
    if (this.getSelectedItem()) {
      const stroke = this.getSelectedItem().character.attackRange;
      const arr = this.calcRange(this.gameState.selected, stroke);
      return arr.includes(idx);
    }
    return false;
  }

  /**
   * Функция проверяет правильный диапозон атаки
   * @returns возвращет выбранного персонажа
   */
  getSelectedItem() {
    return this.gameState.allPositions.find((elem) => elem.position === this.gameState.selected);
  }

  /**
   * Функция возврщает возможные позиции на старте
   * @returns {Array} 
   */
  getUserStartPositions() {
    const size = this.gamePlay.boardSize;
    this.userPosition = [];
    for (let i = 0, j = 1; this.userPosition.length < size * 2; i += size, j += size) {
      this.userPosition.push(i, j);
    }
    return this.userPosition;
  }

  /**
   * Функция возврщает возможные позиции на старте для компьютерного игрока
   * @returns {Array} 
   */
  getComputerStartPositions() {
    const size = this.gamePlay.boardSize;
    this.computerPosition = [];
    for (let i = size - 2, j = size - 1; this.computerPosition.length < size * 2; i += size, j += size) {
      this.computerPosition.push(i, j);
    }
    return this.computerPosition;
  }


  /**
   * Функция возврщает рандомную позицию
   * @param {Array}  массив возможных позиций при старте
   * @returns рандомное число
   */
  getRandom(positions) {
    this.positions = positions;
    return this.positions[Math.floor(Math.random() * this.positions.length)];
  }


  /**
   * Функция добаляется метод gameState.allPositions
   * @param {Object} команда (игрока или компьютера)
   * @returns {Array} positions массив возможных значений при старте игры 
   */
  addTheTeamToPosition(team, positions) {
    const copyPositions = [...positions];
    for (const item of team) {
      const random = this.getRandom(copyPositions);
      this.gameState.allPositions.push(new PositionedCharacter(item, random));
      copyPositions.splice(copyPositions.indexOf(random), 1);
    }
  }

  /**
   * Функция проверяет по индексу игрока  ли персонаж
   * @param {number} idx индекс игрока
   * @returns boolean
   */
  isUserItem(idx) {
    if (this.getItem(idx)) {
      const item = this.getItem(idx).character;
      return this.userCharacter.some((elem) => item instanceof elem);
    }
    return false;
  }

  /**
   * Функция проверяет по индексу компьютерного игрока  ли персонаж
   * @param {number} idx индекс компьютерного игрока
   * @returns boolean
   */
  isComputerItem(idx) {
    if (this.getItem(idx)) {
      const computer = this.getItem(idx).character;
      return this.computerCharacter.some((elem) => computer instanceof elem);
    }
    return false;
  }

  /**
   * @param {number} idx индекс  игрока
   * @returns возарщает персонажа по индексу из gameState.allPositions
   */
  getItem(idx) {
    return this.gameState.allPositions.find((elem) => elem.position === idx);
  }

  /**
   * Расчитывает диапазон перемещения или атаки
   * @param {number} idx индекс персонажа
   * @param {number} item значение свойства персонажа
   * @returns возвращает массив валидных индексов
   */
  calcRange(idx, item) {
    const brSize = this.gamePlay.boardSize;
    const range = [];
    const leftBorder = [];
    const rightBorder = [];

    for (let i = 0, j = brSize - 1; leftBorder.length < brSize; i += brSize, j += brSize) {
      leftBorder.push(i);
      rightBorder.push(j);
    }

    for (let i = 1; i <= item; i += 1) {
      range.push(idx + (brSize * i));
      range.push(idx - (brSize * i));
    }

    for (let i = 1; i <= item; i += 1) {
      if (leftBorder.includes(idx)) {
        break;
      }
      range.push(idx - i);
      range.push(idx - (brSize * i + i));
      range.push(idx + (brSize * i - i));

      if (leftBorder.includes(idx - i)) {
        break;
      }
    }

    for (let i = 1; i <= item; i += 1) {
      if (rightBorder.includes(idx)) {
        break;
      }
      range.push(idx + i);
      range.push(idx - (brSize * i - i));
      range.push(idx + (brSize * i + i));
      if (rightBorder.includes(idx + i)) {
        break;
      }
    }

    return range.filter((elem) => elem >= 0 && elem <= (brSize ** 2 - 1));
  }

  onNewGameClick() {
    this.userTeam = new Team();
    this.computerTeam = new Team();
    this.computerCharacter = [Daemon, Undead, Vampire];
    this.userCharacter = [Bowman, Swordsman, Magician];
    this.gameState.selected = null;
    this.gameState.level = 1;
    this.gameState.points = 0;
    this.gameState.allPositions = [];
    this.gameState.isUsersTurn = true;

    this.gamePlay.drawUi(themes[this.gameState.level]);
    this.userTeam.addAll(generateTeam([Bowman, Swordsman], 1, 2));
    this.computerTeam.addAll(generateTeam(this.computerCharacter, 1, 2));
    this.addTheTeamToPosition(this.userTeam, this.getUserStartPositions());
    this.addTheTeamToPosition(this.computerTeam, this.getComputerStartPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    GamePlay.showMessage(`Уровень ${this.gameState.level}`);
  }

  onSaveGameClick() {
    this.stateService.save(GameState.from(this.gameState));
    GamePlay.showMessage('Игра сохранена');
  }

  onLoadGameClick() {
    GamePlay.showMessage('Игра загружается');
    const load = this.stateService.load();

    if (!load) {
      GamePlay.showError('Ошибка загрузки');
    }

    this.gameState.isUsersTurn = load.isUsersTurn;
    this.gameState.level = load.level;
    this.gameState.allPositions = [];
    this.gameState.points = load.points;
    this.gameState.statistics = load.statistics;
    this.gameState.selected = load.selected;
    this.userTeam = new Team();
    this.computerTeam = new Team();

    load.allPositions.forEach((elem) => {
      let item;

      switch (elem.character.type) {
        case 'swordsman':
          item = new Swordsman(elem.character.level);
          this.userTeam.addAll([item]);
          break;
        case 'bowman':
          item = new Bowman(elem.character.level);
          this.userTeam.addAll([item]);
          break;
        case 'magician':
          item = new Magician(elem.character.level);
          this.userTeam.addAll([item]);
          break;
        case 'undead':
          item = new Undead(elem.character.level);
          this.botTeam.addAll([item]);
          break;
        case 'vampire':
          item = new Vampire(elem.character.level);
          this.botTeam.addAll([item]);
          break;
        case 'daemon':
          item = new Daemon(elem.character.level);
          this.botTeam.addAll([item]);
          break;
      }
      item.health = elem.character.health;
      this.gameState.allPositions.push(new PositionedCharacter(item, elem.position));
    });
    this.gamePlay.drawUi(themes[this.gameState.level]);
    this.gamePlay.redrawPositions(this.gameState.allPositions);
  }

}
