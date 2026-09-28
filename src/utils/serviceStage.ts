import type { ServiceStage, UserRole } from '../types';

const STAGES: ServiceStage[] = ['kabul', 'ariza_tespiti', 'onarimda', 'hazir', 'teslim_edildi'];

export type TransitionError = 'terminal' | 'invalid' | 'apprentice' | 'skip' | 'manager_required';

export function serviceTransitionError(current: ServiceStage, target: ServiceStage, role: UserRole): TransitionError | null {
  if (current === 'teslim_edildi') return 'terminal';
  const from = STAGES.indexOf(current);
  const to = STAGES.indexOf(target);
  if (from < 0 || to < 0 || from === to) return 'invalid';
  if (role === 'cirak' && (target === 'hazir' || target === 'teslim_edildi')) return 'apprentice';
  if (to > from + 1) return 'skip';
  if (to < from && role !== 'yonetici') return 'manager_required';
  return null;
}
