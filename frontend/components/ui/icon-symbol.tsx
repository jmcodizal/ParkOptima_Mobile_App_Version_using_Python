// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Lightweight helper: prefer MaterialIcons names. If an SF-style key is provided,
// extend the mapping below.
const SF_TO_MATERIAL: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
  'qrcode': 'qr-code',
  'chart.bar': 'show-chart',
  'creditcard': 'credit-card',
  'person': 'person',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const mapped = SF_TO_MATERIAL[name] ?? (name as ComponentProps<typeof MaterialIcons>['name']);
  return <MaterialIcons color={color} size={size} name={mapped} style={style} />;
}
