import React from 'react';
import renderer from 'react-test-renderer';
import LayersControl from './LayersControl';

jest.mock('../../../../../../utils/toast', () => ({
  toast: {
    displayError: jest.fn(),
  },
}));

jest.mock('@blueprintjs/core', () => ({
  Checkbox: props => <input type="checkbox" {...props} />,
  Icon: props => <div {...props} />,
  Popover: props => <div {...props} />,
  Position: {
    BOTTOM_LEFT: 'bottom-left',
  },
}));

jest.mock('@terralego/core/modules/Map/InteractiveMap', () => {
  const InteractiveMap = () => <div>InteractiveMap</div>;
  InteractiveMap.INTERACTION_FN = 'function';
  return InteractiveMap;
});

jest.mock('@terralego/core/modules/Map', () => ({}));

jest.mock('@terralego/core/components/Tooltip', () => props => <div {...props} />);

const defaultProps = {
  translate: text => text,
  map: {
    addLayer: jest.fn(),
    addSource: jest.fn(),
    setLayoutProperty: jest.fn(),
    getSource: id => id === 'foo',
    getLayoutProperty: id => (id === 'foo' ? 'visible' : 'none'),
  },
};

describe('snapshots', () => {
  it('should not display anything', () => {
    const tree = renderer
      .create(<LayersControl layers={[]} relations={[]} {...defaultProps} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('should display layers', () => {
    const tree = renderer
      .create(
        <LayersControl
          {...defaultProps}
          layers={[
            {
              id: 'id1',
              'source-layer': 'foo',
              source: '1',
              title: 'Foo',
            },
            {
              id: 'id2',
              'source-layer': 'bar',
              source: '2',
              title: 'Bar',
            },
          ]}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  it('should display relations', () => {
    const tree = renderer
      .create(
        <LayersControl
          {...defaultProps}
          layers={[
            {
              id: 'id1',
              'source-layer': 'foo',
              source: '1',
              title: 'POIs',
              view_source: 'relation',
            },
            {
              id: 'id2',
              'source-layer': 'bar',
              source: '2',
              title: 'Touristics content',
              view_source: 'relation',
            },
          ]}
          relations={[
            {
              label: 'POIs',
              order: 40,
              url: '/api/crud/layers/29/features/foo/relation/11/features/',
              geojson: '/api/crud/layers/29/features/foo/relation/11/features.geojson',
              crud_view_pk: 17,
              id_layer_vt: 'foo',
              empty: false,
            },
            {
              label: 'Touristics content',
              order: 1,
              url: '/api/crud/layers/29/features/bar/relation/11/features/',
              geojson: '/api/crud/layers/29/features/bar/relation/11/features.geojson',
              crud_view_pk: 2,
              id_layer_vt: 'bar',
              empty: true,
            },
          ]}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
