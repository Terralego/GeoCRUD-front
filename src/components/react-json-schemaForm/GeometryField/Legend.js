import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeometryField } from './GeometryFieldProvider';

const Legend = ({ title, ...props }) => {
  const { t } = useTranslation();
  const { isRequired, isRequiredInEditView } = useGeometryField();

  const mandatoryField = isRequired ? ' *' : null;
  const mandatoryLegend = isRequiredInEditView ? (
    <span className="details__list-edit-mandatory">{t('CRUD.details.mandatory')}</span>
  ) : null;

  return (
    <legend {...props}>
      <span>
        {title}
        {mandatoryField}
      </span>
      {mandatoryLegend}
    </legend>
  );
};

export default memo(Legend);
