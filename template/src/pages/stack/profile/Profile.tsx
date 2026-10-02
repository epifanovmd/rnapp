import { IUserStore } from "@entities/user";
import { EditProfileModal } from "@features/edit-profile";
import { AvatarPicker, PrivacySettingsForm } from "@features/profile-settings";
import { useNavigation } from "@shared/lib/navigation";
import {
  NavbarIcon,
  ScreenScroll,
  ScreenState,
  Section,
  Tag,
  Text,
  Touchable,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useState } from "react";

import { ProfileDetails } from "./ProfileDetails";

/** Экран «Профиль»: аватар, сведения, приватность; правка данных — в шторке из навбара. */
export const Profile: FC = observer(() => {
  const userStore = IUserStore.useInstance();
  const navigation = useNavigation();
  const [isEditOpen, setEditOpen] = useState(false);

  const model = userStore.profile;
  const profile = userStore.user?.profile;

  const openEdit = useCallback(() => setEditOpen(true), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);
  const reload = useCallback(() => userStore.load(), [userStore]);

  // После сбоя сети или hot reload стор может быть пуст — экран перечитывает
  // пользователя сам (есть данные — «тихо»).
  useEffect(() => {
    userStore.load();
  }, [userStore]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: model
        ? () => (
            <Touchable
              onPress={openEdit}
              accessibilityRole={"button"}
              accessibilityLabel={"Редактировать профиль"}
            >
              <NavbarIcon name={"edit"} size={20} />
            </Touchable>
          )
        : undefined,
    });
  }, [navigation, model, openEdit]);

  return (
    <ScreenScroll onRefresh={reload}>
      <ScreenState
        isLoading={userStore.isLoading}
        isEmpty={!model}
        error={model ? undefined : userStore.error}
        onRetry={reload}
      >
        {!!model && (
          <>
            <Section title={"Аватар"}>
              <AvatarPicker />
            </Section>

            <ProfileDetails
              title={"Личные данные"}
              onPress={openEdit}
              fields={[
                { label: "Имя", value: profile?.firstName },
                { label: "Фамилия", value: profile?.lastName },
                { label: "Пол", value: profile?.gender },
                {
                  label: "Дата рождения",
                  value: profile?.birthDate
                    ? model.birthDateModel.formattedDate
                    : null,
                },
                { label: "Язык", value: profile?.locale },
              ]}
            />

            <ProfileDetails
              title={"Контакты"}
              fields={[
                { label: "Email", value: model.email },
                {
                  label: "Статус email",
                  value: model.email ? (
                    <Tag
                      variant={model.emailVerified ? "success" : "warning"}
                      dot={true}
                    >
                      {model.emailVerified ? "Подтверждён" : "Не подтверждён"}
                    </Tag>
                  ) : null,
                },
                { label: "Телефон", value: model.phone },
                { label: "Роль", value: model.roleLabel },
              ]}
            />

            <Section
              title={"Приватность"}
              description={"Что видят другие пользователи."}
            >
              <PrivacySettingsForm />
            </Section>

            {!!profile?.createdAt && (
              <Text
                textStyle={"Caption_M3"}
                color={"textTertiary"}
                textAlign={"center"}
              >
                {`Зарегистрирован ${model.registeredAtDate.formattedDate}`}
              </Text>
            )}
          </>
        )}
      </ScreenState>

      <EditProfileModal open={isEditOpen} onClose={closeEdit} />
    </ScreenScroll>
  );
});
