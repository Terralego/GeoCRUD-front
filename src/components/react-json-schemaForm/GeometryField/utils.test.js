import { getDirectionsThemes } from './utils';

jest.mock('@terralego/core/modules/Api', () => ({
  request: jest.fn(),
}));

jest.mock('../../../utils/toast', () => ({
  toast: {
    displayError: jest.fn(),
  },
}));

it('should return an empty array if there are no settings', () => {
  expect(getDirectionsThemes({ routingSettings: [] })).toEqual([]);
});

const routingSettings = [
  {
    label: 'Driving',
    provider: {
      name: 'mapbox',
      options: {
        transit: 'driving',
      },
    },
  },
  {
    label: 'Cycling',
    provider: {
      name: 'mapbox',
      options: {
        transit: 'cycling',
      },
    },
    selected: true,
  },
  {
    label: 'Other',
    provider: {
      name: 'foo',
      options: {
        transit: 'walking',
        url: 'http://api.request.fake',
      },
    },
  },
];

it('should not return mapbox providers if there are not access token ', () => {
  expect(getDirectionsThemes({ routingSettings }).length).toEqual(1);
});

it('should return all providers', () => {
  expect(getDirectionsThemes({ routingSettings, accessToken: 'FAKE_ACCESS_TOKEN' }).length).toEqual(
    3,
  );
});

it('should selected the defined item', () => {
  expect(
    getDirectionsThemes({
      routingSettings,
      accessToken: 'FAKE_ACCESS_TOKEN',
    }).findIndex(({ selected }) => selected),
  ).toEqual(1);
});

it('should selected the last item', () => {
  expect(
    getDirectionsThemes({
      routingSettings,
      selectedProvider: 2,
      accessToken: 'FAKE_ACCESS_TOKEN',
    }).findIndex(({ selected }) => selected),
  ).toEqual(2);
});
