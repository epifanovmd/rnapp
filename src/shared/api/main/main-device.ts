import DeviceInfo from "react-native-device-info";

export interface IDeviceDescription {
  model: string;
  systemName: string;
  systemVersion: string;
  isTablet: boolean;
}

/** Значение заголовка — только печатный ASCII: модель бывает локализованной. */
const toHeaderValue = (value: string) =>
  value.replace(/[^\x20-\x7e]/g, "").trim();

/** Заголовки устройства по его описанию: сервер кладёт их в сессию при входе. */
export const buildDeviceHeaders = (
  device: IDeviceDescription,
): Record<string, string> => ({
  "X-Device-Name": toHeaderValue(
    `${device.model}, ${device.systemName} ${device.systemVersion}`,
  ),
  "X-Device-Type": device.isTablet ? "tablet" : "mobile",
});

/** Имя и тип текущего устройства для сессии на сервере. */
export const deviceHeaders = (): Record<string, string> =>
  buildDeviceHeaders({
    model: DeviceInfo.getModel(),
    systemName: DeviceInfo.getSystemName(),
    systemVersion: DeviceInfo.getSystemVersion(),
    isTablet: DeviceInfo.isTablet(),
  });
