import { authModule } from "@entities/auth";
import { userModule } from "@entities/user";
import { apiModule } from "@shared/api";
import { appStateModule } from "@shared/lib/app-state";
import { iocContainer } from "@shared/lib/di";
import { mediaModule } from "@shared/lib/media";
import { navigationModule } from "@shared/lib/navigation";
import { networkModule } from "@shared/lib/network";
import { notificationModule } from "@shared/lib/notifications";
import { socketModule } from "@shared/lib/socket";
import { storageModule } from "@shared/lib/storage";
import { themeModule } from "@shared/lib/theme";
import { webrtcModule } from "@shared/lib/webrtc";

import { appDataModule } from "./app-data.module";

export const registerContainerModules = (): void => {
  iocContainer.unbindAll();

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
