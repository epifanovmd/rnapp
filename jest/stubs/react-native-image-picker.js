// Нативный модуль недоступен в jest: по умолчанию пользователь отменяет выбор.
module.exports = {
  launchImageLibrary: () => Promise.resolve({ didCancel: true }),
  launchCamera: () => Promise.resolve({ didCancel: true }),
};
