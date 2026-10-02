/** Поле демо-формы в строке AnchorList. */
export interface IAnchorListField {
  key: string;
  label: string;
  description?: string;
  multiline?: boolean;
}

/** 24 поля: профиль, адрес доставки, заказ. */
export const ANCHOR_LIST_FIELDS: IAnchorListField[] = [
  { key: "firstName", label: "Имя" },
  { key: "lastName", label: "Фамилия" },
  { key: "middleName", label: "Отчество", description: "Необязательно" },
  { key: "email", label: "Email", description: "Для подтверждения заказа" },
  { key: "phone", label: "Телефон" },
  { key: "extraPhone", label: "Дополнительный телефон" },
  { key: "company", label: "Компания", description: "Необязательно" },
  { key: "position", label: "Должность" },
  { key: "country", label: "Страна" },
  { key: "region", label: "Регион" },
  { key: "city", label: "Город" },
  { key: "street", label: "Улица" },
  { key: "house", label: "Дом" },
  { key: "building", label: "Корпус" },
  { key: "apartment", label: "Квартира" },
  { key: "entrance", label: "Подъезд" },
  { key: "floor", label: "Этаж" },
  { key: "intercom", label: "Домофон" },
  { key: "postalCode", label: "Индекс", description: "6 цифр" },
  { key: "orderNumber", label: "Номер заказа", description: "Формат: AB-1234" },
  { key: "deliveryDate", label: "Дата доставки" },
  { key: "deliveryTime", label: "Время доставки" },
  { key: "promoCode", label: "Промокод" },
  {
    key: "comment",
    label: "Комментарий курьеру",
    description: "Многострочное поле",
    multiline: true,
  },
];
