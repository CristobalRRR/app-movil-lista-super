import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppDrawerContent from './AppDrawerContent';
import CatalogoScreen from '../screens/CatalogoScreen';
import OpcionesScreen from '../screens/OpcionesScreen';
import InformacionScreen from '../screens/InformacionScreen';
import ListStackNavigator from './ListStackNavigator';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="ListStack"
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="ListStack" component={ListStackNavigator} />
      <Drawer.Screen name="Catalogo" component={CatalogoScreen} />
      <Drawer.Screen name="Opciones" component={OpcionesScreen} />
      <Drawer.Screen name="Informacion" component={InformacionScreen} />
    </Drawer.Navigator>
  );
}