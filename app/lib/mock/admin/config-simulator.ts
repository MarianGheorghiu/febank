import type { FlagRule } from '../../types/admin/flags-config';
export const CONFIG_SIMULATION_PROFILES: {id: string; name: string; audience: FlagRule['audience']}[] = [
  {id: 'simulation-example-0001', name: 'Alex · Retail', audience: 'all'},
  {id: 'simulation-example-0002', name: 'Sofia · Premium', audience: 'premium'},
  {id: 'simulation-example-0003', name: 'Studio North · Business', audience: 'business'},
  {id: 'simulation-example-0004', name: 'QA operator · Internal', audience: 'internal'},
  {id: 'simulation-example-0005', name: 'Mara · Retail', audience: 'all'},
  {id: 'simulation-example-0006', name: 'Daniel · Premium', audience: 'premium'},
  {id: 'simulation-example-0007', name: 'Orbit Labs · Business', audience: 'business'},
  {id: 'simulation-example-0008', name: 'Release tester · Internal', audience: 'internal'},
  {id: 'simulation-example-0009', name: 'Victor · Retail', audience: 'all'},
  {id: 'simulation-example-0010', name: 'Eva · Premium', audience: 'premium'},
  {id: 'simulation-example-0011', name: 'Oak Design · Business', audience: 'business'},
  {id: 'simulation-example-0012', name: 'Support operator · Internal', audience: 'internal'},
];
