export default class Team {
  constructor() {
    this.members = new Set();
  }

  add(character) {
    if (this.members.has(character)) {
      throwError(`${this.members} уже существует в команде`);
    }
    this.members.add(character);
  }

  addAll(characters) {
    this.members = new Set([...this.members, ...characters]);
  }

  delete(item) {
    this.members.delete(item);
  }

  toArray() {
    return [...this.members];
  }

  *[Symbol.iterator]() {
    for (const gamer of this.members) {
      yield gamer;
    }
  }

}
