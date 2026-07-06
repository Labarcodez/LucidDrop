window.process = window.process || {
  env: { NODE_ENV: 'production' },
  browser: true,
  version: '',
  versions: {},
  platform: 'browser',
};

export const browser = true;
export default window.process;