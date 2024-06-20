import { createSlot, useSlotProps } from "@force-dev/react";
import {
  ModalHeader,
  ModalHeaderProps,
  RenderConditional,
} from "@force-dev/react-mobile";
import React, { FC, memo, PropsWithChildren, useCallback } from "react";

import {
  ModalActions,
  ModalActionsProps,
  ModalActionsSlots,
} from "../../modal";
import { Field, FieldProps, FieldSlots } from "../field";
import { RangePickerProps, YearRangePicker } from "../picker";
import { Text } from "../text";
import { ModalFieldSlots } from "./ModalField";
import { SelectField } from "./SelectField";

export interface YearRangeFieldProps {
  title?: string;
  range?: [number | undefined, number | undefined] | null;
  onChange?: (range: [number, number]) => void;
}

const Modal = createSlot<ModalFieldSlots>("Modal");
const ModalHeaderSlot = createSlot<ModalHeaderProps>("ModalHeader");
const ModalActionsSlot =
  createSlot<Omit<ModalActionsProps, "onReject" | "onAccept">>("ModalActions");
const Picker =
  createSlot<
    Omit<RangePickerProps<number>, "modalProps" | "range" | "onChange">
  >("Picker");

const FieldSlot = createSlot<FieldProps>("Field");

export interface YearRangeFieldSlots extends FieldSlots, ModalActionsSlots {
  Modal: typeof Modal;
  ModalHeader: typeof ModalHeaderSlot;
  ModalActions: typeof ModalActionsSlot;
  Picker: typeof Picker;
  Field: typeof FieldSlot;
}

const _YearRangeField: FC<PropsWithChildren<YearRangeFieldProps>> = memo(
  ({ title, range: r, onChange, children }) => {
    const {
      picker,
      modal,
      modalHeader,
      modalActions,
      rejectButton,
      acceptButton,
      field,
      leftIcon,
      label,
      content,
      contentValue,
      rightIcon,
      description,
      error,
    } = useSlotProps(YearRangeField, children);

    const value = `${r?.[0] ? `от ${r[0]} ` : ""}${r?.[1] ? `до ${r[1]}` : ""}`;

    const renderHeader = useCallback(
      (onClose: () => void) => {
        return (
          <ModalHeader
            color={"#000"}
            onClose={onClose}
            label={title}
            {...modalHeader}
          />
        );
      },
      [modalHeader, title],
    );

    const renderFooter = useCallback(
      ({ onReset, onApply }: { onReset: () => void; onApply: () => void }) => {
        return (
          <ModalActions
            rejectTitle={"Сбросить"}
            mt={32}
            {...modalActions}
            onReject={onReset}
            onAccept={onApply}
          >
            <ModalActions.RejectButton {...rejectButton} />
            <ModalActions.AcceptButton {...acceptButton} />
          </ModalActions>
        );
      },
      [acceptButton, modalActions, rejectButton],
    );

    return (
      <YearRangePicker
        {...picker}
        modalProps={modal}
        range={r}
        onChange={onChange}
        renderHeader={renderHeader}
        renderFooter={renderFooter}
      >
        <Field {...field}>
          <Field.Label text={title} {...label} />
          <Field.LeftIcon {...leftIcon} />
          <Field.Content {...content}>
            {content?.children ?? (
              <RenderConditional if={value}>
                <Text color={"#fff"}>{value}</Text>
              </RenderConditional>
            )}
          </Field.Content>
          <Field.ContentValue {...contentValue} />
          <Field.RightIcon {...rightIcon} />
          <Field.Error color={"red"} {...error} />
          <Field.Description {...description} />
        </Field>
      </YearRangePicker>
    );
  },
);

export const YearRangeField = _YearRangeField as typeof _YearRangeField &
  YearRangeFieldSlots;

YearRangeField.Modal = Modal;
YearRangeField.ModalHeader = ModalHeaderSlot;

YearRangeField.ModalActions = SelectField.ModalActions;
YearRangeField.RejectButton = SelectField.RejectButton;
YearRangeField.AcceptButton = SelectField.AcceptButton;

YearRangeField.Field = FieldSlot;
YearRangeField.Label = Field.Label;
YearRangeField.LeftIcon = Field.LeftIcon;
YearRangeField.RightIcon = Field.RightIcon;
YearRangeField.Content = Field.Content;
YearRangeField.ContentValue = Field.ContentValue;
YearRangeField.Description = Field.Description;
YearRangeField.Error = Field.Error;
