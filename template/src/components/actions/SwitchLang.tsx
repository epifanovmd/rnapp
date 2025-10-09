import { useTranslation } from "@core";
import React, { FC, memo, PropsWithChildren, useCallback } from "react";

import { FlexProps, Row } from "../flexView";
import { Switch } from "../ui";

interface IProps extends FlexProps {}

export const SwitchLang: FC<PropsWithChildren<IProps>> = memo(({ ...rest }) => {
  const { changeLanguage, i18n } = useTranslation();

  const change = useCallback(() => {
    if (i18n.language === "ru") {
      changeLanguage("en").then();
    } else {
      changeLanguage("ru").then();
    }
  }, [changeLanguage, i18n.language]);

  return (
    <Row {...rest}>
      <Switch isActive={i18n.language === "ru"} onChange={change} />
    </Row>
  );
});
