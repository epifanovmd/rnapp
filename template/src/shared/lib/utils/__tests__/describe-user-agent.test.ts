import { describeUserAgent } from "../describe-user-agent";

describe("describeUserAgent", () => {
  it("браузер и ОС из строки Chrome на macOS", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      ),
    ).toBe("Chrome, Mac OS X");
  });

  it("Edge называет Edge, а не Chrome", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 Edg/140.0",
      ),
    ).toBe("Edge, Windows");
  });

  it("мобильное приложение на iOS (CFNetwork/Darwin)", () => {
    expect(describeUserAgent("App/1 CFNetwork/3860.700.2 Darwin/25.6.0")).toBe(
      "Приложение, iOS",
    );
  });

  it("мобильное приложение на Android (okhttp)", () => {
    expect(describeUserAgent("okhttp/4.12.0")).toBe("Приложение, Android");
  });

  it("без User-Agent — прочерк", () => {
    expect(describeUserAgent(null)).toBe("—");
  });

  it("незнакомый клиент — начало строки", () => {
    expect(describeUserAgent("my-bot")).toBe("my-bot");
  });
});
