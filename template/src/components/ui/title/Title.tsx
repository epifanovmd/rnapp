import React, {FC, PropsWithChildren} from 'react';
import {observer} from 'mobx-react-lite';
import {Col, FlexProps, Row, useFlexProps} from '@force-dev/react-mobile';
import {useRoute} from '../../../navigation';
import {useTranslation} from '../../../localization';
import {Text, TextProps} from '../text';

export interface TitleProps extends FlexProps {
  title?: string;
  rightSlot?: React.JSX.Element;

  textProps?: TextProps;
}

export const Title: FC<PropsWithChildren<TitleProps>> = observer(
  ({title, rightSlot, textProps, children, ...rest}) => {
    const {flexProps, animated} = useFlexProps(rest);
    const route = useRoute();
    const {t} = useTranslation();

    const _title = title || t(`navigation.${route.name}` as any);

    return (
      <Row
        minHeight={36}
        pv={4}
        mb={4}
        alignItems={'center'}
        justifyContent={'space-between'}
        {...flexProps}
        animated={animated}>
        {children ?? (
          <Text fontSize={18} fontWeight={'600'} {...textProps}>
            {_title}
          </Text>
        )}

        <Col>{rightSlot}</Col>
      </Row>
    );
  },
);
