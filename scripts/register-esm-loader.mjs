import { register } from 'node:module';

register(new URL('./node-esm-extension-loader.mjs', import.meta.url));
