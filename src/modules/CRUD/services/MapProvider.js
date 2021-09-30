import React, { useState, useCallback, useRef, useEffect } from 'react';
import connect from 'react-ctx-connect';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_CONTROLS,
  CONTROL_CAPTURE,
  CONTROL_BACKGROUND_STYLES,
  CONTROL_SEARCH,
  CONTROLS_TOP_RIGHT,
} from '@terralego/core/modules/Map';

import { getLayers, getSources } from './CRUD';

import { getBounds } from './features';

const BASE_SEARCH_API_PROVIDER = 'https://nominatim.openstreetmap.org/search?';
const CUSTOM_LAYER_WEIGHT = 850;

const CONTROL_LIST = [
  {
    control: CONTROL_BACKGROUND_STYLES,
    position: CONTROLS_TOP_RIGHT,
  },
  {
    control: CONTROL_CAPTURE,
    position: CONTROLS_TOP_RIGHT,
  },
];

const sortByOrder = ({ order: a = 0 }, { order: b = 0 }) => a - b;

export const MapContext = React.createContext({});
export const connectMapProvider = connect(MapContext);

const { Provider } = MapContext;

export const MapProvider = ({ children }) => {
  const detailsRef = useRef(null);
  const dataTableRef = useRef(null);

  const [controls, setControls] = useState([...DEFAULT_CONTROLS, ...CONTROL_LIST]);
  const [interactiveMapProps, setInteractiveMapProps] = useState(undefined);
  const [sources, setSources] = useState([]);
  const [layers, setLayers] = useState([]);

  const [map, setMap] = useState(null);

  const { i18n } = useTranslation();

  const loadIconsInMap = useCallback(
    list => {
      if (!list) {
        return;
      }
      list.forEach(({ label, url }) => {
        if (map.hasImage(label)) {
          return;
        }
        map.loadImage(url, (error, image) => {
          if (error) {
            throw error;
          }
          map.addImage(label, image);
        });
      });
    },
    [map],
  );

  const loadSourceAndLayer = useCallback(
    (settings, layerId) => {
      if (
        sources.find(source => source.id === `${layerId}`) &&
        layers.filter(({ source }) => source === `${layerId}`)
      ) {
        map && map.style.sourceCaches[layerId].clearTiles();
        return;
      }
      const nextSource = getSources(settings).find(source => source.id === `${layerId}`);
      setSources(prevSources => [...prevSources, nextSource]);

      const nextLayers = getLayers(settings)
        .filter(({ source }) => source === `${layerId}`)
        .map(nextLayer => ({ ...nextLayer, weight: CUSTOM_LAYER_WEIGHT }));

      nextLayers.forEach(({ iconList }) => {
        loadIconsInMap(iconList);
      });

      setLayers(prevLayers => [...prevLayers, ...nextLayers]);
    },
    [layers, loadIconsInMap, map, sources],
  );

  const setFitBounds = useCallback(
    ({ coordinates, hasDetails }) => {
      if (!coordinates.length || !map) return;

      const { current: detail } = detailsRef;
      const { current: dataTable } = dataTableRef;

      // Keep the boundaries visible on the screen with a padding of ~20px
      // `50` for the right to avoid geometries displayed under the zoom control
      const padding = {
        top: 20,
        right: hasDetails ? detail?.offsetWidth ?? 0 + 50 : 50,
        bottom: !hasDetails ? dataTable?.offsetHeight ?? 0 + 20 : 20,
        left: 20,
      };
      map.resize();
      map.fitBounds(getBounds(coordinates), { padding, duration: 0 });
    },
    [dataTableRef, detailsRef, map],
  );

  const onSearch = useCallback(
    async query => {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('format', 'geojson');
      params.append('accept-language', i18n.language);

      const headers = new Headers([['Content-Type', 'application/json']]);
      let results;
      try {
        results = await fetch(`${BASE_SEARCH_API_PROVIDER}${params}`, {
          headers,
        }).then(response => response.json());
      } catch (e) {
        return null;
      }
      // Filter to avoid duplicates location
      const filteredFeatures = results.features.reduce((list, result) => {
        if (!list.some(item => item.properties.display_name === result.properties.display_name)) {
          list.push(result);
        }
        return list;
      }, []);
      const data = [
        {
          total: filteredFeatures.length,
          results: filteredFeatures.map(
            ({ bbox, properties: { osm_id: id, display_name: label } }) => ({
              label,
              id,
              bounds: bbox,
            }),
          ),
        },
      ];
      return data;
    },
    [i18n.language],
  );

  const onSearchResultClick = useCallback(
    ({ result: { bounds } }) => {
      const [xMin, yMin, xMax, yMax] = bounds;
      setFitBounds({
        coordinates: [
          [xMin, yMin],
          [xMax, yMax],
        ],
        hasDetails: Boolean(detailsRef.current),
      });
    },
    [setFitBounds],
  );

  useEffect(() => {
    if (!map) {
      return;
    }
    setControls(prevControls => {
      if (prevControls.some(({ control }) => control === CONTROL_SEARCH)) {
        return prevControls;
      }
      return [
        {
          control: CONTROL_SEARCH,
          position: CONTROLS_TOP_RIGHT,
          maxResults: 10,
          onSearch,
          onSearchResultClick,
          order: -1,
        },
        ...prevControls,
      ].sort(sortByOrder);
    });
  }, [map, onSearch, onSearchResultClick]);

  const addControl = useCallback(controlToAdd => {
    if (!controlToAdd) return;
    setControls(prevControls => {
      if (prevControls.some(({ control }) => control === controlToAdd.control)) {
        return prevControls;
      }
      return [controlToAdd, ...prevControls].sort(sortByOrder);
    });
  }, []);

  const removeControl = useCallback(controlToRemove => {
    if (!controlToRemove) return;
    setControls(prevControls => {
      if (prevControls.some(({ control }) => control === controlToRemove)) {
        return prevControls.filter(({ control }) => control !== controlToRemove);
      }
      return prevControls;
    });
  }, []);

  const featureToHighlight = useCallback(
    ({ featureId, layer, hover }) => {
      const { id: layerId, source } =
        layers.find(({ 'source-layer': sourceLayer }) => sourceLayer === layer) || {};
      if (!map || !featureId || !layerId) {
        return;
      }
      const { addHighlight, removeHighlight } = interactiveMapProps;
      if (hover) {
        addHighlight &&
          addHighlight({
            layerId,
            featureId,
            highlightColor: 'red',
            unique: true,
            source,
          });
      } else {
        removeHighlight &&
          removeHighlight({
            layerId,
            featureId,
          });
      }
    },
    [interactiveMapProps, layers, map],
  );

  const value = {
    addControl,
    controls,
    detailsRef,
    dataTableRef,
    featureToHighlight,
    interactiveMapProps,
    layers,
    loadIconsInMap,
    loadSourceAndLayer,
    map,
    setControls,
    setFitBounds,
    setMap,
    setLayers,
    setInteractiveMapProps,
    setSources,
    sources,
    removeControl,
  };

  return <Provider value={value}>{children}</Provider>;
};

export default MapProvider;
