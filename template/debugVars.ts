import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "Sending `onAnimatedValueUpdate` with no listeners registered.",
]);

export const DebugVars = {
  logNavHistory: false,
  logRequest: false,
  disableLogs: false,
};

if (DebugVars.disableLogs) {
  LogBox.ignoreAllLogs(true);
}

// Вкючение переменных
// DebugVars.logNavHistory = true;
DebugVars.logRequest = true;
// DebugVars.disableLogs = true;
