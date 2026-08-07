require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "OcrEngine"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/epifanovmd/rnapp"
  s.license      = package["license"]
  s.authors      = "epifanovmd"

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/epifanovmd/rnapp.git", :tag => "#{s.version}" }

  s.source_files = [
    # Implementation (Swift)
    "ios/**/*.{swift}",
    # Autolinking/Registration (Objective-C++)
    "ios/**/*.{m,mm}",
  ]
  s.frameworks = ["AVFoundation", "Vision", "CoreML"]

  load 'nitrogen/generated/ios/OcrEngine+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'VisionCamera'
  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  install_modules_dependencies(s)
end
