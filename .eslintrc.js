module.exports = {
  root: true,
  extends: ['react-app', 'makina', 'prettier'],

  // Custom rules
  rules: {
    'operator-linebreak': ['off'],
    'react/destructuring-assignment': ['error'],
    'react/no-this-in-sfc': ['error'],
    'react/no-access-state-in-setstate': ['error'],
    'import/no-cycle': ['off'],
    'space-before-function-paren': ['off'],
  },
};
