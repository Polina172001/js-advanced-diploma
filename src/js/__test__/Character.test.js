import Character from "../Character";
import Bowman from "../Characters/Bowman";
import Swordsman from "../Characters/Swordsman";
import Magician from "../Characters/Magician";
import Vampire from "../Characters/Vampire";
import Undead from "../Characters/Undead";
import Daemon from "../Characters/Daemon";

test('Создание нового объекта класса Character выбрасывает ошибку', () => {
  expect(() => new Character(1)).toThrowError(new Error('It is impossible!'));
});

test.each([
  [new Bowman(1)],
  [new Swordsman(1)],
  [new Magician(1)],
  [new Vampire(1)],
  [new Undead(1)],
  [new Daemon(1)],
])(('Без ошибки'), (item) => {
  expect(() => item).not.toThrow();
}, );
