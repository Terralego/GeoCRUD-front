import React from 'react';
import { useTranslation } from 'react-i18next';

import PropTypes from 'prop-types';

import GeometryFieldProvider from './GeometryFieldProvider';

import ImportGeomFile from '../../ImportGeomFile';

import MapInteraction from './MapInteraction';
import Informations from './Informations';
import Legend from './Legend';
import ResetGeometry from './ResetGeometry';
import './styles.scss';

const GeometryField = ({ formData, name, onChange, schema }) => {
  const { t } = useTranslation();

  return (
    <GeometryFieldProvider formData={formData} onChange={onChange} name={name} schema={schema}>
      <fieldset className="geometry-field">
        <Legend className="geometry-field__legend" title={schema.title} />
        <div className="geometry-field__col">
          <MapInteraction />
          <div className="form-group field">
            <div className="geometry-field__row">
              <Informations schema={schema} />
            </div>
            <span className="geometry-field__or">
              <span>{t('jsonSchema.geometryField.or')}</span>
            </span>
            <div className="geometry-field__row">
              <ImportGeomFile />
            </div>
          </div>
        </div>
        <ResetGeometry intent="danger" schema={schema} />
      </fieldset>
    </GeometryFieldProvider>
  );
};

GeometryField.propTypes = {
  formData: PropTypes.shape({
    coordinates: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.array])),
    type: PropTypes.string,
  }),
  name: PropTypes.string,
  onChange: PropTypes.func,
  schema: PropTypes.shape({}),
};

GeometryField.defaultProps = {
  formData: {
    coordinates: [],
    type: '',
  },
  name: undefined,
  onChange: () => {},
  schema: undefined,
};

export default GeometryField;
