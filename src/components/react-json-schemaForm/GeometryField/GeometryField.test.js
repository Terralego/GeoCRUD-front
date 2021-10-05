import React from 'react';
import renderer from 'react-test-renderer';

import GeometryField from './GeometryField';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: text => text,
  }),
}));

jest.mock('./GeometryFieldProvider', () => props => <div {...props} />);
jest.mock('../../ImportGeomFile', () => props => <div {...props} />);
jest.mock('./MapInteraction', () => props => <div {...props} />);
jest.mock('./ResetGeometry', () => props => <div {...props} />);
jest.mock('./Informations', () => props => <div {...props} />);
jest.mock('./Legend', () => props => <div {...props} />);

it('should snapshot correctly', () => {
  const tree = renderer.create(<GeometryField schema={{ title: 'foo' }} />).toJSON();
  expect(tree).toMatchSnapshot();
});
