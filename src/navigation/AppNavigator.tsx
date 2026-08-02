import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppDrawerContent from './AppDrawerContent';
import CatalogoScreen from '../screens/CatalogoScreen';
import OpcionesScreen from '../screens/OpcionesScreen';
import InformacionScreen from '../screens/InformacionScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
 
const Drawer = createDrawerNavigator();
 
export default function AppNavigator() {
  return (
    <Drawer.Navigator
      // "Nueva lista" default route while no specific list is selected
      initialRouteName="ListDetail"
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{ headerShown: false }} // each screen draws its own custom header per mockup
    >
      <Drawer.Screen name="ListDetail" component={ListDetailScreen} />
      <Drawer.Screen name="Catalogo" component={CatalogoScreen} />
      <Drawer.Screen name="Opciones" component={OpcionesScreen} />
      <Drawer.Screen name="Informacion" component={InformacionScreen} />
    </Drawer.Navigator>
  );
}