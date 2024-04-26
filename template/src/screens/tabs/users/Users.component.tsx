import {Col, Input, Row} from '@force-dev/react-mobile';
import {observer} from 'mobx-react-lite';
import React, {FC, useCallback, useMemo} from 'react';
import {ListRenderItemInfo} from 'react-native';
import {Button, Container, Content, Header, Text} from '../../../components';
import {RefreshingContainer} from '../../../components/layouts/RefreshingContainer.tsx';
import {AppScreenProps} from '../../../navigation';
import {IUser} from '../../../service';
import {useUsersVM} from './Users.vm.ts';

export const Users: FC<AppScreenProps> = observer(() => {
  const {loading, list, onRefresh, onSearch} = useUsersVM();

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
      <Header />
      <Content>
        <Row pa={16}>
          <Input placeholder={'placeholder'} onChangeText={onSearch} />
        </Row>
        <Text>{`Loading - ${loading}`}</Text>
        <Button title={'refrash'} onPress={onRefresh} />

        <RefreshingContainer.FlatList
          refreshing={loading}
          onRefresh={onRefresh}
          data={list}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={listEmptyComponent}
          ListFooterComponent={listFooterComponent}
          renderItem={renderItem}
        />
      </Content>
    </Container>
  );
});
