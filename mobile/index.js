import 'react-native-get-random-values';
import 'expo-standard-web-crypto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
global.isSecureContext = true;

import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);

