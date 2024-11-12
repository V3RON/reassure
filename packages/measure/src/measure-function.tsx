import { performance } from 'perf_hooks';
import { config } from './config';
import type { MeasureResults } from './types';
import { type RunResult, processRunResults } from './measure-helpers';
import { showFlagsOutputIfNeeded, writeTestStats } from './output';

export interface MeasureFunctionOptions {
  runs?: number;
  warmupRuns?: number;
  writeFile?: boolean;
}

export async function measureFunction(fn: () => void, options?: MeasureFunctionOptions): Promise<MeasureResults> {
  assertNotUsingFakeTimers();

  const stats = await measureFunctionInternal(fn, options);

  if (options?.writeFile !== false) {
    await writeTestStats(stats, 'function');
  }

  return stats;
}

function measureFunctionInternal(fn: () => void, options?: MeasureFunctionOptions): MeasureResults {
  const runs = options?.runs ?? config.runs;
  const warmupRuns = options?.warmupRuns ?? config.warmupRuns;

  showFlagsOutputIfNeeded();

  const runResults: RunResult[] = [];
  for (let i = 0; i < runs + warmupRuns; i += 1) {
    const timeStart = getCurrentTime();
    fn();
    const timeEnd = getCurrentTime();

    const duration = timeEnd - timeStart;
    runResults.push({ duration, count: 1 });
  }

  return processRunResults(runResults, warmupRuns);
}

function getCurrentTime() {
  return performance.now();
}

function assertNotUsingFakeTimers() {
  const isUsingFakeTimers =
    typeof jest !== 'undefined' &&
    typeof setTimeout !== 'undefined' &&
    (Object.hasOwn(setTimeout, '_isMockFunction') || Object.hasOwn(setTimeout, 'clock'));

  if (isUsingFakeTimers) {
    throw new Error(
      'Reassure is not compatible jest.useFakeTimers. You should only use fake timers in your feature tests.'
    );
  }
}
