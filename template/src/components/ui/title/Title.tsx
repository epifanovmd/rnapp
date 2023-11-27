import React, {FC, PropsWithChildren} from 'react';
import {observer} from 'mobx-react-lite';
import {Col, FlexProps, Row, useFlexProps} from '../flexView';
import {useRoute, useTranslateScreenName} from '../../../navigation';
import {Text} from '../text';

export interface TitleProps extends FlexProps {
  title?: string;
  rightSlot?: JSX.Element;
}

export const Title: FC<PropsWithChildren<TitleProps>> = observer(
  ({title, rightSlot, children, ...rest}) => {
    const {flexProps, animated} = useFlexProps(rest);
    const route = useRoute();
    const _title = useTranslateScreenName(route.name);

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
          <Text fontSize={18} fontWeight={'600'}>
            {title || _title}
          </Text>
        )}

        <Col>{rightSlot ?? null}</Col>
      </Row>
    );
  },
);
