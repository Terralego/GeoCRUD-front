import React from 'react';
import Router from 'react-router-dom';
import renderer from 'react-test-renderer';
import Map from './Map';
import { CRUDContext } from '../../../../services/CRUDProvider';
import { MapContext } from '../../../../services/MapProvider';

jest.mock('@terralego/core/modules/Map', () => ({
  CONTROL_CUSTOM: 'custom-control',
  CONTROLS_TOP_LEFT: 'control-top-left',
}));

jest.mock('@terralego/core/modules/Map/InteractiveMap', () => {
  const InteractiveMap = props => <div {...props} />;
  InteractiveMap.INTERACTION_FN = 'function';
  return InteractiveMap;
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    id: undefined,
    layer: undefined,
  }),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      getResourceBundle: jest.fn(() => ({
        terralego: {
          map: 'mapLocale',
        },
      })),
      language: 'en-en',
      store: {
        options: { fallbackLng: 'en' },
      },
    },
    t: text => text,
  }),
}));

jest.mock('../LayersControl', () => props => <div {...props} />);

const defaultCrudContextProps = {
  feature: { fooId: {} },
  settings: {
    menu: [
      {
        crud_views: [
          {
            extent: [1, 2, 3, 4],
            layer: {
              id: 'fooId',
              name: 'fooLayer',
            },
            map_layers: [
              {
                id_layer_vt: 'fooId',
                name: 'fooLayer',
                style: {},
                main: true,
              },
            ],
          },
          {
            extent: [1, 2, 3, 4],
            layer: {
              id: 'barId',
              name: 'barLayer',
            },
            map_layers: [
              {
                id_layer_vt: 'barId',
                name: 'barLayer',
                style: {},
              },
            ],
          },
        ],
      },
    ],
    config: {
      BASE_LAYERS: [
        { OSM: { id: '1', url: 'endpointToTilejson' } },
        { Mapbox: { id: '2', url: 'endpointToTilejson' } },
      ],
      default: {
        map: {
          mapbox_access_token: 'FAKE_ACCESS_TOKEN',
        },
      },
    },
  },
};

const defaultMapContextProps = {
  addControl: jest.fn(),
  controls: [
    {
      control: 'NavigationControl',
      position: 'top-right',
    },
  ],
  map: {
    getLayer: jest.fn(),
    setFilter: jest.fn(),
    setLayoutProperty: jest.fn(),
  },
  layers: [
    {
      id: 'fooId',
      'source-layer': 'fooLayer',
      source: 'my-source-id',
      type: 'circle',
      paint: {
        'circle-color': '#0075d1',
        'circle-radius': 6,
      },
      title: 'Foo',
      main: true,
      weight: 850,
    },
    {
      id: 'barId',
      'source-layer': 'fooLayer',
      source: 'my-source-id',
      type: 'fill',
      paint: {
        'fill-color': 'black',
        'fill-opacity': 0.4,
      },
      title: 'Bar',
      main: false,
      weight: 850,
    },
  ],
  loadSourceAndLayer: jest.fn(),
  removeControl: jest.fn(),
  setFitBounds: jest.fn(),
  setMap: jest.fn(),
  setInteractiveMapProps: jest.fn(),
  sources: [
    {
      id: 'my-source-id',
      type: 'vector',
      url: '/api/crud/layers/my-source-id/tilejson/',
    },
  ],
};

const MapWithProviders = ({ crudContextProps = {}, mapContextProps = {}, ...props }) => (
  <CRUDContext.Provider value={{ ...defaultCrudContextProps, ...crudContextProps }}>
    <MapContext.Provider value={{ ...defaultMapContextProps, ...mapContextProps }}>
      <Map {...props} />
    </MapContext.Provider>
  </CRUDContext.Provider>
);

describe('should render correctly', () => {
  it('map without object', () => {
    const tree = renderer.create(<MapWithProviders />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('map focus on layer', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ layer: 'fooLayer' });
    const tree = renderer.create(<MapWithProviders />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('map focus on geom object', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ layer: 'fooLayer', id: 'fooId' });
    const tree = renderer.create(<MapWithProviders />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
