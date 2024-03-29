import React, {FC, useCallback, useMemo} from 'react';
import {Button, Container, Text} from '../../../components';
import {FlatList, ListRenderItemInfo} from 'react-native';
import {AppScreenProps} from '../../../navigation';
import {observer} from 'mobx-react-lite';
import {useScreen2VM} from './Screen2.vm';
import {IUser} from '../../../service';
import {Col, Input, Row} from '@force-dev/react-mobile';

export const Screen2: FC<AppScreenProps> = observer(() => {
  const {loading, list, onRefresh, onSearch} = useScreen2VM();

  const keyExtractor = useCallback((item: IUser) => item.id.toString(), []);
  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<IUser>) => (
      <Col mv={8} bg={'gray'} radius={10} pa={6}>
        <Text fontWeight={'bold'}>{item.name}</Text>
        <Text>{item.email}</Text>
        <Text>{item.phone}</Text>
        <Text>{item.website}</Text>
      </Col>
    ),
    [],
  );

  const listHeaderComponent = useMemo(
    () => (
      <Row>
        <Text>{'Header'}</Text>
      </Row>
    ),
    [],
  );
  const listEmptyComponent = useMemo(
    () => (
      <Row>
        <Text>{'Empty'}</Text>
      </Row>
    ),
    [],
  );
  const listFooterComponent = useMemo(
    () => (
      <Row>
        <Text>{'Footer'}</Text>
      </Row>
    ),
    [],
  );
  return (
    <Container>
      <Row pa={16}>
        <Input placeholder={'placeholder'} onChangeText={onSearch} />
      </Row>
      <Text>{`Loading - ${loading}`}</Text>
      <Button title={'refrash'} onPress={onRefresh} />
      <FlatList
        data={list}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        renderItem={renderItem}
      />
    </Container>
  );
});
