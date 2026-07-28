import { authModule } from "@entities/auth/auth.module";
import { userModule } from "@entities/user/user.module";
import { apiModule } from "@shared/api/api.module";
import { appStateModule } from "@shared/lib/app-state/app-state.module";
import { iocContainer } from "@shared/lib/di";
import { mediaModule } from "@shared/lib/media/media.module";
import { navigationModule } from "@shared/lib/navigation/navigation.module";
import { networkModule } from "@shared/lib/network/network.module";
import { notificationModule } from "@shared/lib/notifications/notification.module";
import { socketModule } from "@shared/lib/socket/socket.module";
import { storageModule } from "@shared/lib/storage/storage.module";
import { themeModule } from "@shared/lib/theme/theme.module";
import { webrtcModule } from "@shared/lib/webrtc/webrtc.module";

import { appDataModule } from "./app-data.module";

export const registerContainerModules = (): void => {
  iocContainer.load(
    apiModule,
    authModule,
    userModule,
    appStateModule,
    mediaModule,
    navigationModule,
    networkModule,
    notificationModule,
    storageModule,
    themeModule,
    webrtcModule,
    socketModule,
    appDataModule,
  );
};
