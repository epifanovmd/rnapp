/** Буфер обмена в памяти: нативного модуля в node-окружении нет. */
let value = "";

const Clipboard = {
  setString: text => {
    value = text;
  },
  getString: async () => value,
};

module.exports = { __esModule: true, default: Clipboard, ...Clipboard };
