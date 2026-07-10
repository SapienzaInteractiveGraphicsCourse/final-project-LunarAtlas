export const SPACECRAFT_CATALOG = [
  {
    id: 'gateway-core',
    name: 'Gateway Core',
    description:
      'NASA Gateway core module concept for sustained lunar orbit operations, with large solar arrays and articulated robotic arms.',
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
