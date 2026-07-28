import { PortalHost } from "@gorhom/portal";
import React, { memo } from "react";

export const DIALOG_HOST_NAME = "dialog";

export const DialogHost = memo(() => {
  return <PortalHost name={DIALOG_HOST_NAME} />;
});
