import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { I18nextProvider } from 'react-i18next'; // Import I18nextProvider
import i18n from './src/i18n/i18n'; // Import i18n configuration

export default function App() {
  return (
    <I18nextProvider i18n={i18n}> 
      <AppNavigator />
    </I18nextProvider>
  );
}