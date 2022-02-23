import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Popover, Checkbox, Position } from '@blueprintjs/core';
import Api from '@terralego/core/modules/Api';

import AbstractMapControl from '@terralego/core/modules/Map/helpers/AbstractMapControl';
import Tooltip from '@terralego/core/components/Tooltip';
import { toast } from '../../../../../../utils/toast';

import './styles.scss';

export class LayersControl extends AbstractMapControl {
  static containerClassName = 'mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-layers';

  static propTypes = {
    layers: PropTypes.arrayOf(PropTypes.shape({})),
    relations: PropTypes.arrayOf(PropTypes.shape({})),
    loadSourceAndLayerById: PropTypes.func,
    getMapStyle: PropTypes.func,
  };

  static defaultProps = {
    layers: [],
    relations: [],
    getMapStyle() {},
    loadSourceAndLayerById() {},
    onChange() {},
  };

  state = {
    layers: [],
  };

  componentDidMount() {
    const { layers = [], map } = this.props;
    layers.forEach(({ id }) => {
      if (map.getSource(id)) {
        this.setLayoutProperty(id, map.getLayoutProperty(id, 'visibility') === 'visible');
      }
    });
    this.manageRelationsLayers();
  }

  componentDidMUpdate({ relations: prevRelations }) {
    const { relations } = this.props;
    if (prevRelations !== relations) {
      this.manageRelationsLayers();
    }
  }

  componentWillUnmount() {
    const { map, relations } = this.props;
    relations.forEach(({ crud_view_pk: id }) => {
      const layerId = this.getRelationLayerID(id);
      if (map.getSource(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
  }

  manageRelationsLayers = () => {
    const { layers, relations } = this.props;
    const nextLayers = layers.map(layer => {
      if (layer.view_source !== 'relation') {
        return layer;
      }
      return {
        ...layer,
        ...relations.find(({ id_layer_vt: idLayerVectorTiles } = {}) => idLayerVectorTiles === layer['source-layer'])
      };
    });
    this.setState({ layers: nextLayers });
  };

  getAllRelationData = async ({ method = 'GET', endpoint, body, querystring }) => {
    const { page = 1, pageSize = 100, ...qs } = querystring || {};

    // Get first page to know total
    const { results: firstPage, count } = await Api.request(endpoint, {
      method,
      body,
      querystring: { page, page_size: pageSize, ...qs },
    });

    const pageCount = Math.ceil(count / pageSize);

    const promises = Array.from({ length: pageCount - 1 }, async (_, index) => {
      const { results: nextPage } = await Api.request(endpoint, {
        method,
        body,
        querystring: { page: index + 2, page_size: pageSize, ...qs },
      });
      return nextPage;
    });

    return [firstPage, ...(await Promise.all(promises))].flat().map(({ identifier }) => identifier);
  };

  onChange = async ({ target: { value, checked } }, url) => {
    const { map } = this.props;
    if (url) {
      let data = {};
      try {
        const request = await this.getAllRelationData({ endpoint: url.replace('/api/', '') });
        data = request;
      } catch (e) {
        toast.displayError(e.message);
        return;
      }
      map.setFilter(value, ['in', '_id', ...data]);
      this.setState(({ layers: prevLayers }) => ({
        layers: prevLayers.map(layer =>
          layer.url !== url
            ? layer
            : // To load data once
              { ...layer, url: null },
        ),
      }));
    }
    this.setLayoutProperty(value, checked);
  };

  getRelationLayerID = id => {
    const { featureID } = this.props;
    return `CRUD-${featureID}-relation-${id}`;
  };

  setLayoutProperty = async (layerId, isVisible) => {
    const { map, layers, loadSourceAndLayerById } = this.props;
    const { source } = layers.find(layer => layer.id === layerId);
    const sourceId = Number(source);
    if (map.getSource(sourceId)) {
      map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
    } else if (!Number.isNaN(sourceId)) {
      await loadSourceAndLayerById(sourceId);
      map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
    }
  };

  onClosing = () => {
    this.forceUpdate();
  };

  render() {
    const { map, translate } = this.props;
    const { layers } = this.state;

    if (!layers.length) {
      return null;
    }

    const extraGeomLayers = layers.filter(layer => layer.view_source !== 'relation');
    const relationsLayers = layers.filter(layer => layer.view_source === 'relation');

    return (
      <Tooltip content={translate('CRUD.map.controls.layers.label')} className="layerGroup">
        <Popover
          className="popoverPos"
          onClosing={this.onClosing}
          position={Position.BOTTOM_LEFT}
          content={
            <div className="radioGroup layerGroup__item">
              {extraGeomLayers.length > 0 && (
                <>
                  <h3 className="layerGroup__title">
                    {translate('CRUD.map.controls.layers.title')}
                  </h3>
                  {extraGeomLayers.map(({ title, id, empty = false, source }) => {
                    const defaultChecked =
                      !empty &&
                      map.getSource(source) &&
                      map.getLayoutProperty(id, 'visibility') === 'visible';
                    return (
                      <Checkbox
                        className="bgLayer-radio"
                        defaultChecked={defaultChecked}
                        disabled={empty}
                        key={id}
                        onChange={this.onChange}
                        label={title}
                        value={id}
                      />
                    );
                  })}
                </>
              )}
              {relationsLayers.length > 0 && (
                <>
                  <h3 className="layerGroup__title">
                    {translate('CRUD.map.controls.relations.title')}
                  </h3>
                  {relationsLayers.map(({ title, id, empty = false, source, url }) => (
                    <Checkbox
                      className="bgLayer-radio"
                      defaultChecked={
                        !url &&
                        map.getSource(source) &&
                        map.getLayoutProperty(id, 'visibility') === 'visible'
                      }
                      disabled={empty}
                      key={id}
                      onChange={event => this.onChange(event, url)}
                      label={title}
                      value={id}
                    />
                  ))}
                </>
              )}
            </div>
          }
        >
          <button
            className="mapboxgl-ctrl-icon"
            type="button"
            aria-label={translate('CRUD.map.controls.layers.label')}
          >
            <Icon icon="multi-select" />
          </button>
        </Popover>
      </Tooltip>
    );
  }
}

export default LayersControl;
