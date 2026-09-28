// Нативный модуль недоступен в jest: по умолчанию пользователь отменяет выбор.
const errorCodes = { OPERATION_CANCELED: "OPERATION_CANCELED" };

module.exports = {
  errorCodes,
  types: { allFiles: "*/*" },
  isErrorWithCode: error => !!error && typeof error.code === "string",
  pick: () => Promise.reject({ code: errorCodes.OPERATION_CANCELED }),
  keepLocalCopy: () => Promise.resolve([]),
};
