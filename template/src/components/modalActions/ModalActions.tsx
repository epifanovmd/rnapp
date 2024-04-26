import React, {FC, memo, PropsWithChildren} from 'react';
import {
  createSlot,
  FlexProps,
  Row,
  useSlotProps,
} from '@force-dev/react-mobile';
import {ButtonProps, TextButton} from '../ui';
import {ColorValue} from 'react-native';

export interface ModalActionsProps extends FlexProps {
  onReject?: () => void;
  onAccept?: () => void;
  acceptTitle?: string;
  rejectTitle?: string;
  acceptColor?: ColorValue;
  rejectColor?: ColorValue;
}

const RejectButton = createSlot<Omit<ButtonProps, 'onPress'>>('RejectButton');
const AcceptButton = createSlot<Omit<ButtonProps, 'onPress'>>('AcceptButton');

export interface ModalActionsSlots {
  RejectButton: typeof RejectButton;
  AcceptButton: typeof AcceptButton;
}

export const _ModalActions: FC<PropsWithChildren<ModalActionsProps>> = memo(
  ({
    onReject,
    onAccept,
    acceptTitle = 'Применить',
    rejectTitle = 'Отмена',
    acceptColor = 'red',
    rejectColor = 'red',
    children,
    ...rest
  }) => {
    const {rejectButton, acceptButton} = useSlotProps(ModalActions, children);

    return (
      <Row
        marginTop={'auto'}
        pa={16}
        justifyContent={'space-between'}
        {...rest}>
        {!!onReject && (
          <TextButton
            color={rejectColor}
            title={rejectTitle}
            {...rejectButton}
            onPress={onReject}
          />
        )}
        {!!onAccept && (
          <TextButton
            marginLeft={'auto'}
            color={acceptColor}
            title={acceptTitle}
            {...acceptButton}
            onPress={onAccept}
          />
        )}
      </Row>
    );
  },
);

export const ModalActions = _ModalActions as typeof _ModalActions &
  ModalActionsSlots;

ModalActions.RejectButton = RejectButton;
ModalActions.AcceptButton = AcceptButton;
