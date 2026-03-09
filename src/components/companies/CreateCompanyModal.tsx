import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input,
  Checkbox,
  SpinButton,
  Dropdown,
  Option,
  Subtitle2,
  Switch,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Spinner,
} from '@fluentui/react-components';
import type {
  CreateCompanyFormData,
  IBrokerData,
  IDealerData,
} from '../../types/company';
import {
  CompanyTypeEnum,
  CompanyTypes,
  companyDataDealerTypeFields,
  companyDataBrokerTypeFields,
} from '../../types/company';
import { sendNewCompanyInviteLink } from '../../services/auth/email';
import { getAllMakes } from '../../services/vehicle/vehicle';
import { searchByZipCode } from '../../services/zip-code/zip-code';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanDealerData: IDealerData = {
  dealerName: '',
  dealerLegalName: '',
  dealerId: '',
  defaultMake: '',
  state: '',
  region: '',
  regionCode: '',
  area: '',
  areaCode: '',
  county: '',
  city: '',
  inCity: false,
  zip: '',
  address: '',
  phone: '',
};

const cleanBrokerData: IBrokerData = {
  brokerName: '',
  brokerLegalName: '',
  brokerId: '',
  defaultMake: '',
};

const cleanData: CreateCompanyFormData = {
  companyName: '',
  ownerEmail: '',
  type: CompanyTypeEnum.BROKER,
  isOwnerEmailValid: false,
  isBillingEmailValid: false,
  ownerPhone: '',
  ownerFirstName: '',
  ownerSecondName: '',
  nameOnDisclosure: '',
  billingAddress: '',
  billingCity: '',
  billingZipCode: '',
  billingInCity: false,
  billingState: '',
  billingEmail: '',
  billingTaxId: '',
  billingCounty: '',
  soldToName: '',
  soldToAddress: '',
  soldToCity: '',
  soldToZipCode: '',
  soldToInCity: false,
  soldToState: '',
  soldToEmail: '',
  soldToTaxId: '',
  soldToCounty: '',
  isTrialActive: false,
  trialDays: 14,
  dealerData: { ...cleanDealerData },
  brokerData: { ...cleanBrokerData },
};

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    marginTop: '8px',
    marginBottom: '4px',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  field: {
    minWidth: '200px',
    flex: '1 1 200px',
  },
  surface: {
    maxWidth: '900px',
    width: '90vw',
  },
  zipWrap: {
    position: 'relative',
  },
  zipPickerPanel: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    border: '1px solid #d1d1d1',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    minWidth: '180px',
  },
  zipPickerHeader: {
    padding: '4px 12px',
    fontSize: '11px',
    color: '#666',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #efefef',
  },
  zipPickerOption: {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '13px',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
});

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (success: boolean) => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const styles = useStyles();
  const [formData, setFormData] = useState<CreateCompanyFormData>({ ...cleanData });
  const [makes, setMakes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingZip, setPendingZip] = useState<{
    target: 'billing' | 'soldTo' | 'dealer';
    results: import('../../services/zip-code/zip-code').ZipCodeResult[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMakes();
    }
  }, [isOpen]);

  useEffect(() => {
    const isDealerType = formData.type === CompanyTypeEnum.DEALER;
    setFormData((prev) => {
      const data = {
        ...prev,
        dealerData: { ...cleanDealerData },
        brokerData: { ...cleanBrokerData },
      };
      if (isDealerType) {
        data.dealerData.dealerName = prev.nameOnDisclosure;
        data.dealerData.dealerLegalName = prev.companyName;
      } else {
        data.brokerData.brokerName = prev.nameOnDisclosure;
        data.brokerData.brokerLegalName = prev.companyName;
      }
      return data;
    });
  }, [formData.type]);

  const loadMakes = async () => {
    if (makes.length) return;
    try {
      const res = await getAllMakes();
      setMakes(res.makes);
    } catch {
      // silent
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmailBlur = (field: 'ownerEmail' | 'billingEmail') => {
    const validField = field === 'ownerEmail' ? 'isOwnerEmailValid' : 'isBillingEmailValid';
    setFormData((prev) => ({
      ...prev,
      [validField]: emailRegex.test(prev[field]),
    }));
  };

  const updateTypeData = (fieldName: string, value: any) => {
    const isDealer = formData.type === CompanyTypeEnum.DEALER;
    const dataKey = isDealer ? 'dealerData' : 'brokerData';
    setFormData((prev) => ({
      ...prev,
      [dataKey]: { ...prev[dataKey], [fieldName]: value },
    }));
  };

  const handleClose = () => {
    setFormData({ ...cleanData });
    setErrorMessage('');
    setPendingZip(null);
    onClose();
  };

  const handleZipSearch = useCallback(async (
    zipCode: string,
    target: 'billing' | 'soldTo' | 'dealer',
  ) => {
    if (zipCode.length < 5) return;
    const results = await searchByZipCode(zipCode);
    if (!results || results.length === 0) return;
    setPendingZip({ target, results });
  }, []);

  const applyZipResult = useCallback((result: import('../../services/zip-code/zip-code').ZipCodeResult) => {
    if (!pendingZip) return;
    const { target } = pendingZip;
    const { state, city, county, inCity } = result;
    if (target === 'billing') {
      setFormData((prev) => ({
        ...prev,
        billingState: state,
        billingCity: city,
        billingCounty: county,
        billingInCity: inCity,
      }));
    } else if (target === 'soldTo') {
      setFormData((prev) => ({
        ...prev,
        soldToState: state,
        soldToCity: city,
        soldToCounty: county,
        soldToInCity: inCity,
      }));
    } else if (target === 'dealer') {
      setFormData((prev) => ({
        ...prev,
        dealerData: {
          ...prev.dealerData,
          state,
          county,
          city,
          inCity,
        },
      }));
    }
    setPendingZip(null);
  }, [pendingZip]);

  const isFormValid = () => {
    const f = formData;
    const base =
      f.companyName?.trim() &&
      f.ownerEmail?.trim() &&
      f.isOwnerEmailValid &&
      f.ownerPhone?.trim() &&
      f.ownerFirstName?.trim() &&
      f.ownerSecondName?.trim() &&
      f.nameOnDisclosure?.trim() &&
      f.billingAddress?.trim() &&
      f.billingCity?.trim() &&
      f.billingZipCode?.trim() &&
      f.billingEmail?.trim() &&
      f.isBillingEmailValid &&
      f.billingState?.trim() &&
      f.billingTaxId?.trim();

    if (!base) return false;

    if (f.type === CompanyTypeEnum.DEALER) {
      return (
        f.dealerData.dealerName?.trim() &&
        f.dealerData.dealerLegalName?.trim() &&
        f.dealerData.dealerId?.trim() &&
        f.dealerData.defaultMake?.trim()
      );
    }
    return (
      f.brokerData.brokerName?.trim() &&
      f.brokerData.brokerLegalName?.trim() &&
      f.brokerData.brokerId?.trim()
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const { isOwnerEmailValid, isBillingEmailValid, ...body } = formData;

    try {
      const result = await sendNewCompanyInviteLink(body);
      setFormData({ ...cleanData });
      onCreated(result);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to create company',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const typeFields =
    formData.type === CompanyTypeEnum.DEALER
      ? companyDataDealerTypeFields
      : companyDataBrokerTypeFields;

  if (!isOpen) return null;

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {errorMessage && (
                <MessageBar intent="error">
                  <MessageBarBody>{errorMessage}</MessageBarBody>
                </MessageBar>
              )}

              <Subtitle2 className={styles.section}>Company Information</Subtitle2>
              <div className={styles.row}>
                <Field label="Company Name" required className={styles.field}>
                  <Input
                    value={formData.companyName}
                    onChange={(_, d) => updateField('companyName', d.value)}
                    placeholder="Company Name"
                  />
                </Field>
                <Field label="Name On Disclosure" required className={styles.field}>
                  <Input
                    value={formData.nameOnDisclosure}
                    onChange={(_, d) => updateField('nameOnDisclosure', d.value)}
                    placeholder="Name On Disclosure"
                  />
                </Field>
                <Field label="Company Type" required className={styles.field}>
                  <Dropdown
                    value={CompanyTypes.find((t) => t.key === formData.type)?.text || ''}
                    selectedOptions={[formData.type]}
                    onOptionSelect={(_, d) =>
                      updateField('type', d.optionValue as CompanyTypeEnum)
                    }
                  >
                    {CompanyTypes.map((t) => (
                      <Option key={t.key} value={t.key}>
                        {t.text}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>

              <Subtitle2 className={styles.section}>
                {formData.type === CompanyTypeEnum.DEALER ? 'Dealer Data' : 'Broker Data'}
              </Subtitle2>
              <div className={styles.row}>
                {typeFields.map((field) => {
                  if (field.fieldName === 'inCity') {
                    return (
                      <Field key={field.fieldName} label={field.label} className={styles.field}>
                        <Switch
                          checked={formData.dealerData.inCity ?? false}
                          onChange={(_, d) => updateTypeData('inCity', d.checked)}
                        />
                      </Field>
                    );
                  }
                  if (field.fieldName === 'zip') {
                    return (
                      <Field key={field.fieldName} label={field.label} className={styles.field}>
                        <div className={styles.zipWrap}>
                          <Input
                            value={
                              formData.type === CompanyTypeEnum.DEALER
                                ? (formData.dealerData as any)[field.fieldName] || ''
                                : (formData.brokerData as any)[field.fieldName] || ''
                            }
                            onChange={(_, d) => {
                              updateTypeData(field.fieldName, d.value);
                              if (d.value.length >= 5) {
                                handleZipSearch(d.value, 'dealer');
                              } else {
                                setPendingZip(null);
                              }
                            }}
                            placeholder={field.label}
                          />
                          {pendingZip?.target === 'dealer' && (
                            <div className={styles.zipPickerPanel}>
                              <div className={styles.zipPickerHeader}>Select address</div>
                              {pendingZip.results.map((r, i) => (
                                <button key={i} type="button" className={styles.zipPickerOption} onClick={() => applyZipResult(r)}>
                                  {r.city}, {r.county}, {r.state} — {r.inCity ? 'In City' : 'Out of City'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </Field>
                    );
                  }
                  return (
                    <Field
                      key={field.fieldName}
                      label={field.label}
                      required={field.required}
                      className={styles.field}
                    >
                      {field.fieldName === 'defaultMake' ? (
                        <Dropdown
                          value={
                            formData.type === CompanyTypeEnum.DEALER
                              ? formData.dealerData.defaultMake || ''
                              : formData.brokerData.defaultMake || ''
                          }
                          selectedOptions={[
                            formData.type === CompanyTypeEnum.DEALER
                              ? formData.dealerData.defaultMake || ''
                              : formData.brokerData.defaultMake || '',
                          ]}
                          onOptionSelect={(_, d) =>
                            updateTypeData('defaultMake', d.optionValue as string)
                          }
                          placeholder="Select Make"
                        >
                          {makes.map((make) => (
                            <Option
                              key={make}
                              value={make.toLowerCase().trim().replace(/ /g, '_')}
                            >
                              {make}
                            </Option>
                          ))}
                        </Dropdown>
                      ) : (
                        <Input
                          value={
                            formData.type === CompanyTypeEnum.DEALER
                              ? (formData.dealerData as any)[field.fieldName] || ''
                              : (formData.brokerData as any)[field.fieldName] || ''
                          }
                          onChange={(_, d) =>
                            updateTypeData(field.fieldName, d.value)
                          }
                          placeholder={field.label}
                        />
                      )}
                    </Field>
                  );
                })}
              </div>

              <Subtitle2 className={styles.section}>Owner Information</Subtitle2>
              <div className={styles.row}>
                <Field label="Owner First Name" required className={styles.field}>
                  <Input
                    value={formData.ownerFirstName}
                    onChange={(_, d) => updateField('ownerFirstName', d.value)}
                    placeholder="First Name"
                  />
                </Field>
                <Field label="Owner Last Name" required className={styles.field}>
                  <Input
                    value={formData.ownerSecondName}
                    onChange={(_, d) => updateField('ownerSecondName', d.value)}
                    placeholder="Last Name"
                  />
                </Field>
                <Field
                  label="Owner Email"
                  required
                  className={styles.field}
                  validationState={
                    formData.ownerEmail && !formData.isOwnerEmailValid
                      ? 'error'
                      : undefined
                  }
                  validationMessage={
                    formData.ownerEmail && !formData.isOwnerEmailValid
                      ? 'Invalid email'
                      : undefined
                  }
                >
                  <Input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(_, d) => updateField('ownerEmail', d.value)}
                    onBlur={() => handleEmailBlur('ownerEmail')}
                    placeholder="Email"
                  />
                </Field>
                <Field label="Owner Phone" required className={styles.field}>
                  <Input
                    value={formData.ownerPhone}
                    onChange={(_, d) => updateField('ownerPhone', d.value)}
                    placeholder="Phone"
                  />
                </Field>
              </div>
              <div className={styles.row}>
                <Checkbox
                  label="Is Trial Active"
                  checked={formData.isTrialActive}
                  onChange={(_, d) =>
                    updateField('isTrialActive', d.checked === true)
                  }
                />
                {formData.isTrialActive && (
                  <Field label="Trial Days" className={styles.field}>
                    <SpinButton
                      value={formData.trialDays}
                      min={1}
                      step={1}
                      onChange={(_, d) =>
                        updateField('trialDays', d.value ?? 14)
                      }
                    />
                  </Field>
                )}
              </div>

              <Subtitle2 className={styles.section}>Billing Information</Subtitle2>
              <div className={styles.row}>
                <Field label="Billing Zip Code" required className={styles.field}>
                  <div className={styles.zipWrap}>
                    <Input
                      value={formData.billingZipCode}
                      onChange={(_, d) => {
                        updateField('billingZipCode', d.value);
                        if (d.value.length >= 5) {
                          handleZipSearch(d.value, 'billing');
                        } else {
                          setPendingZip(null);
                        }
                      }}
                      placeholder="Zip Code"
                    />
                    {pendingZip?.target === 'billing' && (
                      <div className={styles.zipPickerPanel}>
                        <div className={styles.zipPickerHeader}>Select address</div>
                        {pendingZip.results.map((r, i) => (
                          <button key={i} type="button" className={styles.zipPickerOption} onClick={() => applyZipResult(r)}>
                            {r.city}, {r.county}, {r.state} — {r.inCity ? 'In City' : 'Out of City'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="Billing State" required className={styles.field}>
                  <Input
                    value={formData.billingState}
                    onChange={(_, d) => updateField('billingState', d.value)}
                    placeholder="State"
                  />
                </Field>
                <Field label="Billing County" className={styles.field}>
                  <Input
                    value={formData.billingCounty}
                    onChange={(_, d) => updateField('billingCounty', d.value)}
                    placeholder="County"
                  />
                </Field>
                <Field label="Billing City" required className={styles.field}>
                  <Input
                    value={formData.billingCity}
                    onChange={(_, d) => updateField('billingCity', d.value)}
                    placeholder="City"
                  />
                </Field>
              </div>
              <div className={styles.row}>
                <Field label="Billing In City" className={styles.field}>
                  <Switch
                    checked={formData.billingInCity}
                    onChange={(_, d) => updateField('billingInCity', d.checked)}
                  />
                </Field>
                <Field label="Billing Address" required className={styles.field}>
                  <Input
                    value={formData.billingAddress}
                    onChange={(_, d) => updateField('billingAddress', d.value)}
                    placeholder="Address"
                  />
                </Field>
                <Field label="Billing Tax ID" required className={styles.field}>
                  <Input
                    value={formData.billingTaxId}
                    onChange={(_, d) => updateField('billingTaxId', d.value)}
                    placeholder="Tax ID"
                  />
                </Field>
                <Field
                  label="Billing Email"
                  required
                  className={styles.field}
                  validationState={
                    formData.billingEmail && !formData.isBillingEmailValid
                      ? 'error'
                      : undefined
                  }
                  validationMessage={
                    formData.billingEmail && !formData.isBillingEmailValid
                      ? 'Invalid email'
                      : undefined
                  }
                >
                  <Input
                    type="email"
                    value={formData.billingEmail}
                    onChange={(_, d) => updateField('billingEmail', d.value)}
                    onBlur={() => handleEmailBlur('billingEmail')}
                    placeholder="Email"
                  />
                </Field>
              </div>

              <Subtitle2 className={styles.section}>Sold To Information</Subtitle2>
              <div className={styles.row}>
                <Field label="Sold To Zip Code" className={styles.field}>
                  <div className={styles.zipWrap}>
                    <Input
                      value={formData.soldToZipCode}
                      onChange={(_, d) => {
                        updateField('soldToZipCode', d.value);
                        if (d.value.length >= 5) {
                          handleZipSearch(d.value, 'soldTo');
                        } else {
                          setPendingZip(null);
                        }
                      }}
                      placeholder="Zip Code"
                    />
                    {pendingZip?.target === 'soldTo' && (
                      <div className={styles.zipPickerPanel}>
                        <div className={styles.zipPickerHeader}>Select address</div>
                        {pendingZip.results.map((r, i) => (
                          <button key={i} type="button" className={styles.zipPickerOption} onClick={() => applyZipResult(r)}>
                            {r.city}, {r.county}, {r.state} — {r.inCity ? 'In City' : 'Out of City'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="Sold To State" className={styles.field}>
                  <Input
                    value={formData.soldToState}
                    onChange={(_, d) => updateField('soldToState', d.value)}
                    placeholder="State"
                  />
                </Field>
                <Field label="Sold To County" className={styles.field}>
                  <Input
                    value={formData.soldToCounty}
                    onChange={(_, d) => updateField('soldToCounty', d.value)}
                    placeholder="County"
                  />
                </Field>
                <Field label="Sold To City" className={styles.field}>
                  <Input
                    value={formData.soldToCity}
                    onChange={(_, d) => updateField('soldToCity', d.value)}
                    placeholder="City"
                  />
                </Field>
                <Field label="Sold To In City" className={styles.field}>
                  <Switch
                    checked={formData.soldToInCity}
                    onChange={(_, d) => updateField('soldToInCity', d.checked)}
                  />
                </Field>
                <Field label="Sold To Name" className={styles.field}>
                  <Input
                    value={formData.soldToName}
                    onChange={(_, d) => updateField('soldToName', d.value)}
                    placeholder="Name"
                  />
                </Field>
                <Field label="Sold To Address" className={styles.field}>
                  <Input
                    value={formData.soldToAddress}
                    onChange={(_, d) => updateField('soldToAddress', d.value)}
                    placeholder="Address"
                  />
                </Field>
              </div>
              <div className={styles.row}>
                <Field label="Sold To Tax ID" className={styles.field}>
                  <Input
                    value={formData.soldToTaxId}
                    onChange={(_, d) => updateField('soldToTaxId', d.value)}
                    placeholder="Tax ID"
                  />
                </Field>
                <Field label="Sold To Email" className={styles.field}>
                  <Input
                    type="email"
                    value={formData.soldToEmail}
                    onChange={(_, d) => updateField('soldToEmail', d.value)}
                    placeholder="Email"
                  />
                </Field>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose} disabled={isLoading}>
              Close
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? <Spinner size="tiny" /> : 'Create'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default CreateCompanyModal;
