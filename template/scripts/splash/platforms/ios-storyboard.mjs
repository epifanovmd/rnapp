import { hexToRgb } from "../utils.mjs";

/** Размер эталонного устройства сториборда (retina4_7). */
const DEVICE = { width: 375, height: 667 };

/**
 * Значение named color прямо в сториборде.
 *
 * Системный launch screen рисуется до старта приложения и не разрешает ссылку
 * на каталог ассетов — без вложенного значения фон падает в чёрный. Xcode
 * пишет этот фолбэк всегда, поэтому пишем и мы.
 */
const namedColor = (name, hex) => {
  const { r, g, b } = hexToRgb(hex);

  return `<namedColor name="${name}">
            <color red="${r / 255}" green="${g / 255}" blue="${b / 255}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
        </namedColor>`;
};

/**
 * Сториборд: логотип по центру, бренд прижат к низу safe area.
 *
 * Кроме констрейнтов проставляются `frame` для эталонного устройства — их
 * использует системный launch screen, который рисует сториборд по сохранённой
 * раскладке, а не пересчитывает Auto Layout.
 */
export const buildStoryboard = ({
  names,
  background,
  logo,
  brand,
  offsetY,
}) => {
  const logoFrame = {
    x: (DEVICE.width - logo.width) / 2,
    y: (DEVICE.height - logo.height) / 2 + offsetY,
  };

  const logoView = `                            <imageView autoresizesSubviews="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="${names.logo}" translatesAutoresizingMaskIntoConstraints="NO" id="logo-view-0001">
                                <rect key="frame" x="${logoFrame.x}" y="${logoFrame.y}" width="${logo.width}" height="${logo.height}"/>
                                <constraints>
                                    <constraint firstAttribute="width" constant="${logo.width}" id="logo-width-001"/>
                                    <constraint firstAttribute="height" constant="${logo.height}" id="logo-height-01"/>
                                </constraints>
                            </imageView>`;

  const brandView = brand
    ? `
                            <imageView autoresizesSubviews="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="${names.brand}" translatesAutoresizingMaskIntoConstraints="NO" id="brand-view-001">
                                <rect key="frame" x="${(DEVICE.width - brand.width) / 2}" y="${DEVICE.height - brand.bottom - brand.height}" width="${brand.width}" height="${brand.height}"/>
                                <constraints>
                                    <constraint firstAttribute="width" constant="${brand.width}" id="brand-width-01"/>
                                    <constraint firstAttribute="height" constant="${brand.height}" id="brand-height-1"/>
                                </constraints>
                            </imageView>`
    : "";

  const brandConstraints = brand
    ? `
                            <constraint firstItem="brand-view-001" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="brand-cx-0001"/>
                            <constraint firstItem="Bcu-3y-fUS" firstAttribute="bottom" secondItem="brand-view-001" secondAttribute="bottom" constant="${brand.bottom}" id="brand-bt-0001"/>`
    : "";

  const brandResource = brand
    ? `\n        <image name="${names.brand}" width="${brand.width}" height="${brand.height}"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina4_7" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21678"/>
        <capability name="Named colors" minToolsVersion="9.0"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController modalTransitionStyle="crossDissolve" id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" autoresizesSubviews="NO" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="${DEVICE.width}" height="${DEVICE.height}"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
${logoView}${brandView}
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
                        <color key="backgroundColor" name="${names.background}"/>
                        <constraints>
                            <constraint firstItem="logo-view-0001" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="logo-cx-00001"/>
                            <constraint firstItem="logo-view-0001" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" constant="${offsetY}" id="logo-cy-00001"/>${brandConstraints}
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="0.0" y="0.0"/>
        </scene>
    </scenes>
    <resources>
        <image name="${names.logo}" width="${logo.width}" height="${logo.height}"/>${brandResource}
        ${namedColor(names.background, background)}
    </resources>
</document>
`;
};
