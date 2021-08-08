export function calcTileType(index, boardSize) {
  // TODO: write logic here
  const field = [
    'top-left', ...Array(boardSize - 2).fill('top'), 'top-rigth',
    ...Array(boardSize - 2).fill(['left', ...Array(boardSize - 2).fill('center'), 'right']),
    'bottom-left', ...Array(boardSize - 2).fill('bottom'), 'bottom-right',
  ].flat();
  return field[index];
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
