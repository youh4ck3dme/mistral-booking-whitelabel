import { describe, expect, it } from 'vitest';
import { aggregateExperimentStats } from './experiment-stats';

describe('aggregateExperimentStats', () => {
  it('returns zeroed stats for an experiment with no impressions', () => {
    const result = aggregateExperimentStats(
      [{ id: 'exp-1', name: 'Test A/B', description: 'desc' }],
      [],
      []
    );

    expect(result).toEqual([
      { id: 'exp-1', name: 'Test A/B', description: 'desc', impressions: 0, conversions: 0, conversionRate: 0 },
    ]);
  });

  it('counts impressions and conversions per experiment', () => {
    const result = aggregateExperimentStats(
      [{ id: 'exp-1', name: 'Test A/B', description: null }],
      [
        { id: 'imp-1', experiment_id: 'exp-1' },
        { id: 'imp-2', experiment_id: 'exp-1' },
        { id: 'imp-3', experiment_id: 'exp-1' },
        { id: 'imp-4', experiment_id: 'exp-1' },
      ],
      [{ impression_id: 'imp-1' }]
    );

    expect(result[0]).toMatchObject({ impressions: 4, conversions: 1, conversionRate: 0.25 });
  });

  it('keeps impressions/conversions scoped to their own experiment', () => {
    const result = aggregateExperimentStats(
      [
        { id: 'exp-1', name: 'A', description: null },
        { id: 'exp-2', name: 'B', description: null },
      ],
      [
        { id: 'imp-1', experiment_id: 'exp-1' },
        { id: 'imp-2', experiment_id: 'exp-2' },
      ],
      [{ impression_id: 'imp-2' }]
    );

    const expA = result.find((r) => r.id === 'exp-1')!;
    const expB = result.find((r) => r.id === 'exp-2')!;
    expect(expA).toMatchObject({ impressions: 1, conversions: 0, conversionRate: 0 });
    expect(expB).toMatchObject({ impressions: 1, conversions: 1, conversionRate: 1 });
  });

  it('ignores conversions whose impression_id does not match any known impression', () => {
    const result = aggregateExperimentStats(
      [{ id: 'exp-1', name: 'A', description: null }],
      [{ id: 'imp-1', experiment_id: 'exp-1' }],
      [{ impression_id: 'orphaned-impression' }, { impression_id: null }]
    );

    expect(result[0]).toMatchObject({ impressions: 1, conversions: 0, conversionRate: 0 });
  });

  it('returns an empty array when there are no experiments', () => {
    expect(aggregateExperimentStats([], [], [])).toEqual([]);
  });
});
