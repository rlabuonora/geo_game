import { useTranslation } from "react-i18next";

type ProgressPanelProps = {
  round: number;
  totalRounds: number;
  foundCount: number;
  totalNeighbors: number;
};

export function ProgressPanel({
  round,
  totalRounds,
  foundCount,
  totalNeighbors
}: ProgressPanelProps) {
  const { t } = useTranslation();
  const currentRound = Math.min(round, totalRounds);
  const progressPercent = (currentRound / totalRounds) * 100;

  return (
    <section className="progress-card" aria-label={t("progress.aria")}>
      <div className="progress-header">
        <span>{t("progress.title")}</span>
        <span>{t("progress.round", { round: currentRound, total: totalRounds })}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="score-chip">
        {t("progress.found", { found: foundCount, total: totalNeighbors })}
      </p>
    </section>
  );
}
