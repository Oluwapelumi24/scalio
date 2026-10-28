import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { InboxChannel } from '../lib/api';

const ICON: Record<InboxChannel, { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string }> = {
  instagram: { name: 'instagram', color: '#c13584' },
  messenger: { name: 'facebook-messenger', color: '#0084ff' },
  whatsapp: { name: 'whatsapp', color: '#25d366' },
};

/** The channel's logo in a small white disc, e.g. on a chat's avatar. */
export function ChannelIcon({ channel, size = 16 }: { channel: InboxChannel; size?: number }) {
  const i = ICON[channel];
  return (
    <View style={{ width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={i.name} size={size} color={i.color} />
    </View>
  );
}
