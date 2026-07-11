export const SPACECRAFT_CATALOG = [
  {
    id: 'gateway-core',
    name: 'Gateway Core',
    description:
      'The Lunar Gateway is a small, NASA‑led international space station that will orbit the Moon in a special near‑rectilinear halo orbit (NRHO), serving as the first long‑term human outpost beyond low‑Earth orbit.',
    modelUrl: new URL('./assets/gateway_core.glb', import.meta.url).href,
    solarPanelPartName: 'Maxar_PPE_Array',
    hasRoboticArmControls: true
  },
  {
    id: 'lunar-reconnaissance-orbiter',
    name: 'Lunar Reconnaissance Orbiter',
    description:
      'A long-running lunar mapping spacecraft used to image the Moon in high detail and support landing site studies.',
    modelUrl: new URL('./assets/lunar_reconnaissance_orbiter.glb', import.meta.url).href
  },
  {
    id: 'apollo-lunar-module',
    name: 'Apollo Lunar Module',
    description:
      'The iconic two-stage lander that carried Apollo crews from lunar orbit to the Moon surface and back.',
    modelUrl: new URL('./assets/apollo_lunar_module.glb', import.meta.url).href
  }
];
