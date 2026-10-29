import type { ConfigState, ConfigPayload } from "@/app/lib/types/admin/flags-config";
import { CONFIG_FLAGS, CONFIG_SETTINGS } from "../../flags-config/catalog";
export { CONFIG_FLAGS, CONFIG_SETTINGS } from "../../flags-config/catalog";

function payload(): ConfigPayload {
  return {
    settings:Object.fromEntries(CONFIG_SETTINGS.map(s=>[s.key,s.default_value])),
    flags:Object.fromEntries(CONFIG_FLAGS.map(f=>[f.key,{enabled:f.default_enabled,rollout_pct:f.key==="new_onboarding"?25:100,audience:f.key==="new_dashboard"?"internal":f.key==="premium_offers"?"premium":f.key==="business_credit"||f.key==="revenue_financing"?"business":"all"}])),
  };
}
export const MOCK_FLAGS_CONFIG: ConfigState = {
  schema_version:1,
  environments:{
    production:{revision:1,published:payload(),releases:[]},
    staging:{revision:1,published:payload(),releases:[]},
    sandbox:{revision:1,published:payload(),releases:[]},
  },
};

// Versioned, illustrative release history; final production values match the baseline.
function seedRelease(environment: 'production' | 'staging', id: number, day: number, reason: string, update: (payload: ConfigPayload) => void) {
  const current = MOCK_FLAGS_CONFIG.environments[environment], before = structuredClone(current.published);
  update(current.published); current.revision++;
  current.releases.unshift({id: `config-demo-${environment}-${id}`, revision: current.revision, timestamp: `2026-10-${day}T09:00:00Z`, actor: 'platform-ops@example.test', reason, restored_from: null, before, after: structuredClone(current.published)});
}
for (let day = 10; day <= 21; day++) {
  seedRelease('production', 100 + day * 2, day, 'Test optional-message capacity in an illustrative release.', p => {p.settings['communications.rate_limit'] = 4;});
  seedRelease('production', 101 + day * 2, day, 'Restore the normal optional-message capacity after observation.', p => {p.settings['communications.rate_limit'] = 3;});
  if (day % 2 === 0) {
    seedRelease('staging', 200 + day * 2, day, 'Increase the staging request budget during a capacity exercise.', p => {p.settings['operations.api_rate_limit'] = 180;});
    seedRelease('staging', 201 + day * 2, day, 'Restore the standard staging request budget after the exercise.', p => {p.settings['operations.api_rate_limit'] = 120;});
  }
}
seedRelease('production', 1, 22, 'Trial a longer customer inactivity window.', p => {p.settings['identity.session_minutes'] = 45;});
seedRelease('production', 2, 23, 'Restore the standard customer session window after review.', p => {p.settings['identity.session_minutes'] = 30;});
seedRelease('production', 3, 24, 'Start guided onboarding with a ten-percent cohort.', p => {p.flags.new_onboarding.rollout_pct = 10;});
seedRelease('production', 4, 25, 'Expand the guided onboarding cohort after the pilot.', p => {p.flags.new_onboarding.rollout_pct = 25;});
seedRelease('production', 5, 26, 'Adjust the payment ceiling after an operational review.', p => {p.settings['transfers.daily_limit_minor'] = 3000000;});
seedRelease('production', 6, 28, 'Restore the default payment ceiling after the observation.', p => {p.settings['transfers.daily_limit_minor'] = 2500000;});
seedRelease('staging', 1, 23, 'Expand the onboarding cohort in the staging environment.', p => {p.flags.new_onboarding.rollout_pct = 50;});
seedRelease('staging', 2, 24, 'Enable crypto limit orders for staging validation.', p => {p.flags.crypto_limit_orders.enabled = true;});
seedRelease('staging', 3, 26, 'Complete the staging onboarding rollout.', p => {p.flags.new_onboarding.rollout_pct = 100;});
seedRelease('staging', 4, 28, 'Pause staging limit orders after validation completes.', p => {p.flags.crypto_limit_orders.enabled = false;});
