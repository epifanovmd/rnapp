import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "Sending `onAnimatedValueUpdate` with no listeners registered.",
]);

export const DebugVars = {
  logNavHistory: __DEV__,
  logRequest: __DEV__,
  disableLogs: false,
};

if (DebugVars.disableLogs) {
  LogBox.ignoreAllLogs(true);
}

DebugVars.logNavHistory = false;
// DebugVars.logRequest = false;
// DebugVars.disableLogs = true;
