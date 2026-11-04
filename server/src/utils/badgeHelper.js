export const getBadgeDetails = (contributions = 0, points = 0) => {
  if (contributions >= 20 || points >= 200) {
    return {
      id: 'legend',
      name: 'Distinguished Counsel',
      tier: 'Tier 1',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      min: 20,
      nextTarget: null,
      desc: 'Top chamber contributor with over 20 verified sitting reports',
    };
  }
  if (contributions >= 10 || points >= 100) {
    return {
      id: 'top',
      name: 'Senior Reporter',
      tier: 'Tier 2',
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.12)',
      min: 10,
      nextTarget: 20,
      desc: 'Consistent courtroom reporter with 10+ verified sitting reports',
    };
  }
  if (contributions >= 5 || points >= 50) {
    return {
      id: 'eagle',
      name: 'Lead Reporter',
      tier: 'Tier 3',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      min: 5,
      nextTarget: 10,
      desc: 'Active courtroom monitor with 5+ verified sitting reports',
    };
  }
  if (contributions >= 3 || points >= 30) {
    return {
      id: 'advocate',
      name: 'Verified Contributor',
      tier: 'Tier 4',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.12)',
      min: 3,
      nextTarget: 5,
      desc: 'Member with 3+ verified courtroom updates',
    };
  }
  if (contributions >= 1 || points >= 10) {
    return {
      id: 'reporter',
      name: 'Active Contributor',
      tier: 'Tier 5',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      min: 1,
      nextTarget: 3,
      desc: 'Verified courtroom sitting reporter',
    };
  }
  return {
    id: 'member',
    name: 'Chamber Member',
    tier: 'Member',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.1)',
    min: 0,
    nextTarget: 1,
    desc: 'Chamber member — report court sitting status to earn recognition',
  };
};
