import { sortBy, sortByOrder } from './sort';

const array = [
  { order: 2, position: 1, classification: null, foo: 'string' },
  { order: 10, position: 4, classification: 0, foo: 'other string' },
  { order: 1, position: null, classification: 3, foo: 'another string' },
  { order: null, position: 2, classification: 1, foo: 'a string too' },
];

it('should sort by order', () => {
  expect(array.sort(sortByOrder)).toEqual([
    { order: 1, position: null, classification: 3, foo: 'another string' },
    { order: 2, position: 1, classification: null, foo: 'string' },
    { order: 10, position: 4, classification: 0, foo: 'other string' },
    { order: null, position: 2, classification: 1, foo: 'a string too' },
  ]);
});

it('should sort by position', () => {
  expect(array.sort(sortBy('position'))).toEqual([
    { order: 2, position: 1, classification: null, foo: 'string' },
    { order: null, position: 2, classification: 1, foo: 'a string too' },
    { order: 10, position: 4, classification: 0, foo: 'other string' },
    { order: 1, position: null, classification: 3, foo: 'another string' },
  ]);
});

it('should sort by classification', () => {
  expect(array.sort(sortBy('classification'))).toEqual([
    { order: 10, position: 4, classification: 0, foo: 'other string' },
    { order: null, position: 2, classification: 1, foo: 'a string too' },
    { order: 1, position: null, classification: 3, foo: 'another string' },
    { order: 2, position: 1, classification: null, foo: 'string' },
  ]);
});

it('should sort nothing by NaN values', () => {
  expect(array.sort(sortBy('foo'))).toEqual(array);
});
