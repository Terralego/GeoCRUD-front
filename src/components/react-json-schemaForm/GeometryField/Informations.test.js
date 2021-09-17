import React from 'react';
import renderer from 'react-test-renderer';
import { GeometryFieldContext } from './GeometryFieldProvider';

import Information from './Informations';

jest.mock('@terralego/core/modules/Map', () => ({}));

jest.mock('../../Message', () => props => <div {...props} />);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: text => text,
  }),
  Trans: () => text => text,
}));

describe('should snapshot correctly', () => {
  it('add required Point', () => {
    const tree = renderer
      .create(
        <GeometryFieldContext.Provider
          value={{
            isRequired: true,
            isRouting: false,
            nextFormData: {
              geom: {
                type: 'Point',
                coordinates: [],
              },
            },
          }}
        >
          <Information />
        </GeometryFieldContext.Provider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('edit required Point', () => {
    const tree = renderer
      .create(
        <GeometryFieldContext.Provider
          value={{
            isRequired: true,
            isRouting: false,
            nextFormData: {
              geom: {
                type: 'Point',
                coordinates: [1, 2],
              },
            },
          }}
        >
          <Information />
        </GeometryFieldContext.Provider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should manipulate routing', () => {
    const tree = renderer
      .create(
        <GeometryFieldContext.Provider
          value={{
            isRequired: false,
            isRouting: true,
            nextFormData: {
              geom: {
                type: 'LineString',
                coordinates: [1, 2],
              },
            },
          }}
        >
          <Information />
        </GeometryFieldContext.Provider>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
