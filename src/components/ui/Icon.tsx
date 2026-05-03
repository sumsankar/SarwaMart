import React from 'react';
import { Feather } from '@expo/vector-icons';

type FeatherName = keyof typeof Feather.glyphMap;

const ICON_MAP: Record<string, FeatherName> = {
  home: 'home', package: 'package', invoice: 'file-text',
  bell: 'bell', menu: 'menu', search: 'search', filter: 'filter',
  plus: 'plus', chevronR: 'chevron-right', chevronL: 'chevron-left',
  chevronD: 'chevron-down', chevronU: 'chevron-up', back: 'arrow-left',
  user: 'user', check: 'check', checkCircle: 'check-circle',
  xCircle: 'x-circle', clock: 'clock', mapPin: 'map-pin',
  fish: 'activity', gavel: 'tool', star: 'star', shield: 'shield',
  camera: 'camera', share: 'share-2', heart: 'heart', edit: 'edit-2',
  logout: 'log-out', send: 'send', msgCircle: 'message-circle',
  receipt: 'file-text', team: 'users', help: 'help-circle',
  globe: 'globe', info: 'info', download: 'download', more: 'more-horizontal',
  trash: 'trash-2', alert: 'alert-triangle', refresh: 'refresh-cw',
  basket: 'shopping-bag',
};

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<Props> = ({ name, size = 20, color = '#1A1C2E', strokeWidth = 2 }) => {
  const iconName = ICON_MAP[name] ?? 'circle';
  return <Feather name={iconName} size={size} color={color} />;
};
