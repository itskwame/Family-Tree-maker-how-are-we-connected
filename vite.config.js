// Default build is the fixture-free release path. Legacy/prototype builds are explicit local tools.
import {releaseConfig} from './scripts/release-config.mjs';
export default ({mode})=>releaseConfig(mode);
