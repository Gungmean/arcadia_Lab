import {writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {organelleSvg} from './organelles.js';
const directory=dirname(fileURLToPath(import.meta.url));
for (const [processId,name] of [['respiration','instrument'],['photosynthesis','chloroplast'],['alcohol','fermentation']]) {
  writeFileSync(join(directory,`${name}.svg`),organelleSvg(processId));
  console.log(`Built ${name}.svg — ${processId}`);
}
