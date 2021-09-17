import React, { useMemo, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Message from '../../Message';
import { useGeometryField } from './GeometryFieldProvider';

const getIconFromType = type => {
  if (type.includes('Point')) {
    return 'point';
  }
  if (type.includes('Line')) {
    return 'line';
  }
  return 'polygon';
};

const Information = ({
  schema: {
    default: { coordinates: schemaCoordinates, type: schemaType },
  },
}) => {
  const { isRequired, isRouting, nextFormData: { geom } = {} } = useGeometryField();

  const { t } = useTranslation();

  const { coordinates = schemaCoordinates, type = schemaType } = geom || {};

  const action = !coordinates.length ? 'create' : 'edit';

  const helperText = useMemo(() => {
    if (isRouting) {
      return t('jsonSchema.geometryField.helper-routing');
    }
    if (action === 'create') {
      return (
        <Trans i18nKey="jsonSchema.geometryField.helper">
          By using the tool
          <span
            className={`mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_${getIconFromType(type)}`}
          />
          on map
        </Trans>
      );
    }
    return t('jsonSchema.geometryField.helper-edit', { type });
  }, [action, isRouting, t, type]);

  return (
    <>
      <p className="control-label">
        <span>
          {t(`jsonSchema.geometryField.information-${action}`, { type })}
          {isRequired && <span className="required">*</span>}
        </span>
      </p>
      <Message className="geometry-field__message" intent="primary">
        {helperText}
      </Message>
    </>
  );
};

Information.propTypes = {
  schema: PropTypes.shape({
    default: PropTypes.shape({
      coordinates: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.array])),
      type: PropTypes.string,
    }),
  }),
};

Information.defaultProps = {
  schema: {
    default: {
      coordinates: [],
      type: undefined,
    },
  },
};

export default memo(Information);
