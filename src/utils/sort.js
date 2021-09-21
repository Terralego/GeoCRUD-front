export const sortBy =
  prop =>
  ({ [prop]: a }, { [prop]: b }) =>
    (typeof a === 'number' ? a : Infinity) - (typeof b === 'number' ? b : Infinity);

export default { sortBy };

export const sortByOrder = sortBy('order');
