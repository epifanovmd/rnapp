# React Native Template

React Native template с архитектурой Feature-Sliced Design:
`app → pages → widgets → features → entities → shared`.

- Текущее устройство и проектные решения: [ARCHITECTURE.md](ARCHITECTURE.md).
- Краткая памятка «что куда класть»: [FSD-CHEATSHEET.md](FSD-CHEATSHEET.md).
- Правила написания кода: [CONVENTIONS.md](CONVENTIONS.md).
- Практика clean code и design principles: [CLEAN-CODE.md](CLEAN-CODE.md) и
  [DESIGN-PRINCIPLES.md](DESIGN-PRINCIPLES.md).

### Stack

- Typescript
- React
- React Navigation
- MobX
- i18next

### Installation

```sh
$ npm install -g @react-native-community/cli
$ npx react-native init ProjectName --template https://github.com/epifanovmd/rnapp
$ cd <ProjectName>
$ yarn clean:android # This step is required for android
```

### Run for Android

```sh
$ chmod 755 android/gradlew
$ yarn android:Dev-Debug
```

### Run for IOS

```sh
$ yarn ios:Dev-Debug
```

### License

MIT

**Free Software, Good Work!**
