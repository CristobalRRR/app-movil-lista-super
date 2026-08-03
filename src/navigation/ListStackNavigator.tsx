//Este stack es para moverse entre las pantallas de editar lista - añadir producto - añadir a catalogo
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListDetailScreen from '../screens/ListDetailScreen';
import ListEditScreen from '../screens/ListEditScreen';
import AddProductToListScreen from '../screens/AddProductToListScreen';

const Stack = createNativeStackNavigator();

export default function ListStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="ListDetail" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListDetail" component={ListDetailScreen} />
      <Stack.Screen name="ListEdit" component={ListEditScreen} />
      <Stack.Screen name="AddProductToList" component={AddProductToListScreen} />
    </Stack.Navigator>
  );
}