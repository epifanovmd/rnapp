import { buildDeviceHeaders, deviceHeaders } from "../main-device";

describe("deviceHeaders", () => {
  it("модель и ОС в имени, тип — телефон или планшет", () => {
    expect(
      buildDeviceHeaders({
        model: "iPad Pro",
        systemName: "iPadOS",
        systemVersion: "26.0",
        isTablet: true,
      }),
    ).toEqual({
      "X-Device-Name": "iPad Pro, iPadOS 26.0",
      "X-Device-Type": "tablet",
    });
  });

  it("не-ASCII в значении заголовка не попадает", () => {
    expect(
      buildDeviceHeaders({
        model: "Телефон Pixel",
        systemName: "Android",
        systemVersion: "16",
        isTablet: false,
      })["X-Device-Name"],
    ).toBe("Pixel, Android 16");
  });

  it("берёт данные текущего устройства", () => {
    expect(deviceHeaders()).toEqual({
      "X-Device-Name": "iPhone 17 Pro, iOS 26.5",
      "X-Device-Type": "mobile",
    });
  });
});
