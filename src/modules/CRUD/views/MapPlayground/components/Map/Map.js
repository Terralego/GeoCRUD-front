import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useParams, useHistory } from 'react-router-dom';

import InteractiveMap, { INTERACTION_FN } from '@terralego/core/modules/Map/InteractiveMap';
import { CONTROL_CUSTOM, CONTROLS_TOP_LEFT } from '@terralego/core/modules/Map';

import { ACTION_CREATE, getLayers, getView } from '../../../../services/CRUD';
import { CRUDContext } from '../../../../services/CRUDProvider';
import { MapContext } from '../../../../services/MapProvider';

import { generateURI } from '../../../../config';
import Message from '../../../../../../components/Message';
import LayersControl from '../LayersControl';
import { usePrevious } from '../../../../../../utils/hooks';

const Map = ({ displayViewFeature, triggerFitBound }) => {
  const [interactions, setInteractions] = useState(null);
  const { feature, settings } = useContext(CRUDContext);

  const {
    addControl,
    controls,
    map,
    layers,
    loadSourceAndLayer,
    removeControl,
    setFitBounds,
    setMap,
    setInteractiveMapProps,
    sources,
  } = useContext(MapContext);

  const { id, layer } = useParams();

  const { push } = useHistory();

  const prevId = usePrevious(id);
  const prevFeature = usePrevious(feature[id]);

  const {
    i18n: {
      getResourceBundle,
      language,
      store: { options: { fallbackLng } },
    },
    t,
  } = useTranslation();

  const view = useMemo(() => getView(settings, layer), [layer, settings]);

  const backgroundStyle = useMemo(() => settings?.config?.BASE_LAYERS?.map(style => {
    const [label] = Object.keys(style);
    return {
      label,
      url: style[label].url,
    };
  }), [settings]);

  const mapConfig = useMemo(() => {
    if (!settings) {
      return null;
    }

    const config = settings?.config?.default.map;

    config.accessToken = config.mapbox_access_token;
    config.backgroundStyle = backgroundStyle;

    delete config.mapbox_access_token;

    return config;
  }, [backgroundStyle, settings]);

  const isFeatureID = useMemo(() => ![undefined, ACTION_CREATE].includes(id), [id]);

  const displayCurrentLayer = useCallback(() => {
    const {
      geometries = {},
    } = feature[id] || {};

    if (!map || !layers.length) {
      return;
    }

    const geometriesIdentifiers = Object.values(geometries)
      .map(({ identifier }) => identifier)
      .filter(Boolean);

    layers.forEach(layerItem => {
      if (!map.getLayer(layerItem.id)) return;
      const { main } = layerItem;
      const conditionalDisplay = layerItem.source === `${view.layer.id}` && (isFeatureID || main);
      map.setLayoutProperty(layerItem.id, 'visibility', conditionalDisplay ? 'visible' : 'none');
      if (geometriesIdentifiers.length && isFeatureID && !main) {
        map.setFilter(layerItem.id, ['in', '_id', ...geometriesIdentifiers]);
      }
    });
  }, [feature, id, isFeatureID, layers, map, view.layer.id]);

  useEffect(() => {
    if (!view || id) {
      setInteractions([]);
      return;
    }

    if (!displayViewFeature) {
      return;
    }

    const { layer: { id: layerId } = {} } = view;

    if (!layerId) {
      return;
    }

    const layersPaints = getLayers(settings);

    const nextInteractions = layersPaints
      .filter(({ source, main }) => source === `${layerId}` && main)
      .map(interaction => ({
        ...interaction,
        interaction: INTERACTION_FN,
        fn: ({
          feature: { sourceLayer, properties: { _id: propId } },
        }) => {
          push(generateURI('layer', { layer: sourceLayer, id: propId }));
        },
      }));

    setInteractions(nextInteractions);
  }, [displayViewFeature, id, push, settings, view]);

  const loadSourceAndLayerById = useCallback(
    layerId => {
      loadSourceAndLayer(settings, layerId);
    },
    [loadSourceAndLayer, settings],
  );

  useEffect(() => {
    if (!settings || !layer || !view || !map) {
      return;
    }

    const {
      layer: { id: layerId },
    } = view;

    loadSourceAndLayerById(layerId);

    displayCurrentLayer();
  }, [displayCurrentLayer, layer, loadSourceAndLayerById, map, settings, view]);

  const onFitBounds = useCallback(() => {
    if (!map || !view) {
      return;
    }

    if (!id && prevId) {
      return;
    }

    if (id === ACTION_CREATE) {
      return;
    }

    const { geom: { coordinates = [] } = {} } = feature[id] || {};
    const { extent: [w, s, e, n] } = view;

    setFitBounds({
      coordinates: isFeatureID ? coordinates : [[w, s], [e, n]],
      hasDetails: !!id,
    });

    // Exclude `prevId` from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, id, isFeatureID, map, setFitBounds, view]);

  useEffect(() => {
    onFitBounds();
  }, [onFitBounds, triggerFitBound]);


  const onMapLoaded = useCallback(nextMap => {
    setMap(nextMap);
  }, [setMap]);

  const onInit = useCallback(props => {
    setInteractiveMapProps(props);
  }, [setInteractiveMapProps]);

  const getMapStyle = useCallback(pk => getView(settings, pk, 'id').mapStyle, [settings]);

  useEffect(() => {
    if (!view) {
      return;
    }
    if (!id) {
      removeControl(CONTROL_CUSTOM);
      return;
    }

    if (prevFeature !== feature[id]) {
      removeControl(CONTROL_CUSTOM);
    }

    if (!isFeatureID) {
      const othersLayers = getLayers(settings).filter(
        ({ main, 'source-layer': sourceLayer }) => main && sourceLayer !== layer,
      );
      if (othersLayers.length) {
        addControl({
          control: CONTROL_CUSTOM,
          featureID: id,
          instance: LayersControl,
          layers: othersLayers,
          order: 1,
          position: CONTROLS_TOP_LEFT,
          loadSourceAndLayerById,
        });
      }
    } else {
      const { relations, geometries } = feature[id] || {};
      const layersProps = layers
        .filter(({ source, main }) => source === `${view.layer.id}` && !main)
        .map(item => ({
          ...item,
          empty: geometries?.[item['source-layer']].geom === null,
        }));

      if (layersProps.length && relations) {
        addControl({
          control: CONTROL_CUSTOM,
          featureID: id,
          getMapStyle,
          instance: LayersControl,
          layers: layersProps,
          order: 1,
          position: CONTROLS_TOP_LEFT,
          relations,
        });
      }
    }
  }, [
    addControl,
    feature,
    getMapStyle,
    id,
    isFeatureID,
    layer,
    layers,
    loadSourceAndLayerById,
    prevFeature,
    removeControl,
    settings,
    view,
  ]);

  const {
    terralego: { map: mapLocale },
  } = useMemo(() => (
    getResourceBundle(language.slice(0, 2)) || getResourceBundle(fallbackLng[0])
  ), [fallbackLng, getResourceBundle, language]);

  if ([mapConfig, interactions].includes(null)) {
    return null;
  }

  if (!backgroundStyle.length) {
    return (
      <Message intent="danger" className="CRUD-no-map">
        {t('CRUD.settings.unableToLoadMap')}
      </Message>
    );
  }

  return (
    <InteractiveMap
      {...mapConfig}
      controls={controls}
      customStyle={{ layers, sources }}
      interactions={interactions}
      onInit={onInit}
      onMapLoaded={onMapLoaded}
      onStyleChange={displayCurrentLayer}
      locale={mapLocale}
      translate={t}
    />
  );
};

Map.propTypes = {
  displayViewFeature: PropTypes.bool,
  triggerFitBound: PropTypes.string,
};

Map.defaultProps = {
  displayViewFeature: true,
  triggerFitBound: undefined,
};

export default Map;
