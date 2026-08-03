import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppDrawerContent from './AppDrawerContent';
import CatalogoScreen from '../screens/CatalogoScreen';
import OpcionesScreen from '../screens/OpcionesScreen';
import InformacionScreen from '../screens/InformacionScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import ListEditScreen from '../screens/ListEditScreen';
import AddProductToListScreen from '../screens/AddProductToListScreen';
 
const Drawer = createDrawerNavigator();
 
export default function AppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="ListDetail"
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="ListDetail" component={ListDetailScreen} />
      <Drawer.Screen name="ListEdit" component={ListEditScreen} />
      <Drawer.Screen name="AddProductToList" component={AddProductToListScreen} />
      <Drawer.Screen name="Catalogo" component={CatalogoScreen} />
      <Drawer.Screen name="Opciones" component={OpcionesScreen} />
      <Drawer.Screen name="Informacion" component={InformacionScreen} />
    </Drawer.Navigator>
  );
}