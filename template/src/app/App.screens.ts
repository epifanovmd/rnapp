/* eslint-disable check-file/filename-naming-convention -- часть неймспейса `App.*`, не обычный модуль */
import { Audit } from "@pages/stack/audit";
import { Chat } from "@pages/stack/chat";
import {
  ButtonsDemo,
  CalendarDemo,
  CalendarListDemo,
  CarouselDemo,
  ChartsDemo,
  Components,
  ContextMenuDemo,
  ControlsDemo,
  DataDemo,
  DialogsDemo,
  FeedbackDemo,
  FormsDemo,
  IconsDemo,
  InputBarDemo,
  InputsDemo,
  KeyboardScrollDemo,
  KeyboardSheetDemo,
  LayoutDemo,
  ListsDemo,
  MediaDemo,
  ModalsDemo,
  NotificationsDemo,
  PickersDemo,
  ScreenDemo,
  ScreenReadyDemo,
  ScreenReadyTargetDemo,
  SettingsDemo,
  TabsDemo,
  TicketDemo,
  TypographyDemo,
} from "@pages/stack/components";
import { ContainerScanner } from "@pages/stack/container-scanner";
import { Files } from "@pages/stack/files";
import { Jobs } from "@pages/stack/jobs";
import { ObjectScanner } from "@pages/stack/object-scanner";
import { PdfView } from "@pages/stack/pdf-view";
import { PlateScanner } from "@pages/stack/plate-scanner";
import { Profile } from "@pages/stack/profile";
import { RecoveryPassword } from "@pages/stack/recovery-password";
import { Security } from "@pages/stack/security";
import { SignIn } from "@pages/stack/sign-in";
import { SignUp } from "@pages/stack/sign-up";
import { TextScanner } from "@pages/stack/text-scanner";
import { WebView } from "@pages/stack/web-view";
import type { PathConfig } from "@react-navigation/core";
import type { ParamListBase } from "@react-navigation/routers";
import {
  CardStyleInterpolators,
  createStackNavigator,
  StackNavigationOptions,
} from "@react-navigation/stack";
import { screenTransitionListeners } from "@shared/lib/navigation";

import { AppHeader } from "./App.header";
import { MainTabs, MainTabsLayout } from "./app-tab-screens";
import { stackTransition } from "./common";
import { useIsSignedIn, useIsSignedOut } from "./hooks";

const NO_HEADER: StackNavigationOptions = { headerShown: false };

/** alias "SignIn" — зарегистрированный redirect_uri GitHub OAuth. */
const SIGN_IN_LINKING: PathConfig<ParamListBase> = {
  path: "signin",
  alias: ["SignIn"],
};

const MODAL_OPTIONS: StackNavigationOptions = {
  cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
  gestureEnabled: false,
  headerShown: false,
};

/**
 * Static-конфиг корневого стека (RN7): группы с guard'ами — экраны доступны
 * только при подходящем auth-состоянии, при его смене RN сам переключает стек.
 * Параметры экранов объявляются на страницах (`ScreenProps<...>`), типы и
 * linking-конфиг выводятся отсюда автоматически.
 */
export const RootStack = createStackNavigator({
  screenListeners: screenTransitionListeners,
  screenOptions: {
    gestureEnabled: true,
    cardOverlayEnabled: true,
    cardStyleInterpolator: stackTransition,
    headerShown: true,
    header: AppHeader,
  },
  groups: {
    Private: {
      if: useIsSignedIn,
      screens: {
        Tabs: {
          screen: MainTabs,
          options: NO_HEADER,
          layout: MainTabsLayout,
        },
        Components: {
          screen: Components,
          options: { title: "Компоненты" },
          linking: "components",
        },
        ComponentsButtons: {
          screen: ButtonsDemo,
          options: { title: "Buttons" },
          linking: "components/buttons",
        },
        ComponentsTypography: {
          screen: TypographyDemo,
          options: { title: "Typography" },
          linking: "components/typography",
        },
        ComponentsIcons: {
          screen: IconsDemo,
          options: { title: "Icons" },
          linking: "components/icons",
        },
        ComponentsInputs: {
          screen: InputsDemo,
          options: { title: "Inputs" },
          linking: "components/inputs",
        },
        ComponentsKeyboardScroll: {
          screen: KeyboardScrollDemo,
          options: { title: "Keyboard · Scroll" },
          linking: "components/keyboard-scroll",
        },
        ComponentsKeyboardSheet: {
          screen: KeyboardSheetDemo,
          options: { title: "Keyboard · Sheet" },
          linking: "components/keyboard-sheet",
        },
        ComponentsControls: {
          screen: ControlsDemo,
          options: { title: "Controls" },
          linking: "components/controls",
        },
        ComponentsForms: {
          screen: FormsDemo,
          options: { title: "Forms" },
          linking: "components/forms",
        },
        ComponentsLayout: {
          screen: LayoutDemo,
          options: { title: "Layout" },
          linking: "components/layout",
        },
        ComponentsLists: {
          screen: ListsDemo,
          options: { title: "Lists" },
          linking: "components/lists",
        },
        ComponentsData: {
          screen: DataDemo,
          options: { title: "Data" },
          linking: "components/data",
        },
        ComponentsSettings: {
          screen: SettingsDemo,
          options: { title: "Settings" },
          linking: "components/settings",
        },
        ComponentsScreen: {
          screen: ScreenDemo,
          options: { title: "Screen" },
          linking: "components/screen",
        },
        ComponentsScreenReady: {
          screen: ScreenReadyDemo,
          options: { title: "ScreenReady" },
          linking: "components/screen-ready",
        },
        ComponentsScreenReadyTarget: {
          screen: ScreenReadyTargetDemo,
          options: { title: "Тяжёлый экран" },
          linking: "components/screen-ready/target",
        },
        ComponentsTabs: {
          screen: TabsDemo,
          options: NO_HEADER,
          linking: "components/tabs",
        },
        ComponentsFeedback: {
          screen: FeedbackDemo,
          options: { title: "Feedback" },
          linking: "components/feedback",
        },
        ComponentsMedia: {
          screen: MediaDemo,
          options: { title: "Media" },
          linking: "components/media",
        },
        ComponentsCarousel: {
          screen: CarouselDemo,
          options: { title: "Carousel" },
          linking: "components/carousel",
        },
        ComponentsNotifications: {
          screen: NotificationsDemo,
          options: { title: "Notifications" },
          linking: "components/notifications",
        },
        ComponentsModals: {
          screen: ModalsDemo,
          options: { title: "Modals" },
          linking: "components/modals",
        },
        ComponentsDialogs: {
          screen: DialogsDemo,
          options: { title: "Dialogs" },
          linking: "components/dialogs",
        },
        ComponentsPickers: {
          screen: PickersDemo,
          options: { title: "Pickers" },
          linking: "components/pickers",
        },
        ComponentsTicket: {
          screen: TicketDemo,
          options: { title: "Ticket" },
          linking: "components/ticket",
        },
        ComponentsCharts: {
          screen: ChartsDemo,
          options: { title: "Charts" },
          linking: "components/charts",
        },
        ComponentsCalendar: {
          screen: CalendarDemo,
          options: { title: "Calendar" },
          linking: "components/calendar",
        },
        ComponentsCalendarList: {
          screen: CalendarListDemo,
          options: { title: "Calendar list" },
          linking: "components/calendar-list",
        },
        ComponentsContextMenu: {
          screen: ContextMenuDemo,
          options: { title: "Context menu" },
          linking: "components/context-menu",
        },
        ComponentsInputBar: {
          screen: InputBarDemo,
          options: { title: "Input bar" },
          linking: "components/input-bar",
        },
        Chat: { screen: Chat, linking: "chat" },
        Profile: {
          screen: Profile,
          options: { title: "Профиль" },
          linking: "profile",
        },
        Security: {
          screen: Security,
          options: { title: "Безопасность" },
          linking: "security",
        },
        Audit: {
          screen: Audit,
          options: { title: "Журнал действий" },
          linking: "audit",
        },
        Files: {
          screen: Files,
          options: { title: "Мои файлы" },
          linking: "files",
        },
        Jobs: {
          screen: Jobs,
          options: { title: "Фоновые задачи" },
          linking: "jobs",
        },
        ContainerScanner: {
          screen: ContainerScanner,
          options: NO_HEADER,
          linking: "containerscanner",
        },
        PlateScanner: {
          screen: PlateScanner,
          options: NO_HEADER,
          linking: "platescanner",
        },
        TextScanner: {
          screen: TextScanner,
          options: NO_HEADER,
          linking: "textscanner",
        },
        ObjectScanner: {
          screen: ObjectScanner,
          options: NO_HEADER,
          linking: "objectscanner",
        },
        PdfView: {
          screen: PdfView,
          options: MODAL_OPTIONS,
          linking: "pdfview",
        },
        WebView: {
          screen: WebView,
          options: MODAL_OPTIONS,
          linking: "webview",
        },
      },
    },
    Public: {
      if: useIsSignedOut,
      screens: {
        SignIn: {
          screen: SignIn,
          options: NO_HEADER,
          linking: SIGN_IN_LINKING,
        },
        SignUp: { screen: SignUp, options: NO_HEADER, linking: "signup" },
        RecoveryPassword: {
          screen: RecoveryPassword,
          options: NO_HEADER,
          linking: "recoverypassword",
        },
      },
    },
  },
});
