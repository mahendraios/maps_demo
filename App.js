import React from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store'; // Import your store and persistor
import MapsScreen from './src/classes/MapsScreen';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <View>
          <MapsScreen />
        </View>
      </PersistGate>
    </Provider>
  );
};

export default App;
