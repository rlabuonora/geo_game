import { useTranslation } from "react-i18next";

type CountryCardProps = {
  name: string;
  isoCode: string;
  prompt: string;
  helperText: string;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
};

export function CountryCard({
  name,
  isoCode,
  prompt,
  helperText,
  actionLabel,
  actionDisabled = false,
  onAction
}: CountryCardProps) {
  const { t } = useTranslation();

  return (
    <article className="country-card">
      <p className="card-label">{t("countryCard.label")}</p>
      <h2>{name}</h2>
      <p className="card-meta">{t("countryCard.iso", { code: isoCode })}</p>
      <p className="card-support">{prompt}</p>
      <p className="card-helper">{helperText}</p>
      <button
        type="button"
        className="start-button top-action"
        disabled={actionDisabled}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </article>
  );
}
