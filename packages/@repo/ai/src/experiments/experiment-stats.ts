export type ExperimentStats = {
  id: string;
  name: string;
  description: string | null;
  impressions: number;
  conversions: number;
  conversionRate: number;
};

/**
 * Pure aggregation, no Supabase calls — RLS on ai_experiments/ai_impressions/
 * ai_conversions requires an authenticated per-request client (tenant_users
 * membership check), so the caller queries with its own authenticated client
 * and passes the raw rows in here.
 */
export function aggregateExperimentStats(
  experiments: Array<{ id: string; name: string; description: string | null }>,
  impressions: Array<{ id: string; experiment_id: string }>,
  conversions: Array<{ impression_id: string | null }>
): ExperimentStats[] {
  const impressionToExperiment = new Map(impressions.map((i) => [i.id, i.experiment_id]));

  const impressionCountByExperiment = new Map<string, number>();
  for (const impression of impressions) {
    impressionCountByExperiment.set(
      impression.experiment_id,
      (impressionCountByExperiment.get(impression.experiment_id) ?? 0) + 1
    );
  }

  const conversionCountByExperiment = new Map<string, number>();
  for (const conversion of conversions) {
    if (!conversion.impression_id) continue;
    const experimentId = impressionToExperiment.get(conversion.impression_id);
    if (!experimentId) continue;
    conversionCountByExperiment.set(experimentId, (conversionCountByExperiment.get(experimentId) ?? 0) + 1);
  }

  return experiments.map((experiment) => {
    const experimentImpressions = impressionCountByExperiment.get(experiment.id) ?? 0;
    const experimentConversions = conversionCountByExperiment.get(experiment.id) ?? 0;
    return {
      id: experiment.id,
      name: experiment.name,
      description: experiment.description,
      impressions: experimentImpressions,
      conversions: experimentConversions,
      conversionRate: experimentImpressions > 0 ? experimentConversions / experimentImpressions : 0,
    };
  });
}
